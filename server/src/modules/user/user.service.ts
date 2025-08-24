import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from './schemas/user.schema';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async onModuleInit() {
    await this.initializeDefaultAdmin();
  }

  async initializeDefaultAdmin() {
    try {
      // 检查是否已存在管理员账号
      const existingAdmin = await this.userModel.findOne({ 
        role: { $in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } 
      }).exec();

      if (existingAdmin) {
        this.logger.log('管理员账号已存在，跳过初始化');
        return;
      }

      // 创建默认管理员账号
      const defaultAdmin = {
        id: uuidv4(),
        username: 'admin',
        password: await bcrypt.hash('admin123', 12),
        email: 'admin@orion-game.com',
        isGuest: false,
        isActive: true,
        role: UserRole.SUPER_ADMIN,
        level: 999,
        experience: 999999,
        coins: 999999,
        gems: 999999,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const admin = new this.userModel(defaultAdmin);
      await admin.save();

      this.logger.log('✅ 默认管理员账号创建成功');
      this.logger.log('👤 用户名: admin');
      this.logger.log('🔑 密码: admin123');
      this.logger.log('📧 邮箱: admin@orion-game.com');
      this.logger.log('🎯 角色: 超级管理员');
      this.logger.warn('⚠️  请在生产环境中修改默认密码！');
      
    } catch (error) {
      this.logger.error('创建默认管理员账号失败:', error);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findOne({ id }).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByDeviceId(deviceId: string): Promise<User | null> {
    return this.userModel.findOne({ deviceId }).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel({
      ...userData,
      id: userData.id || uuidv4(),
      role: userData.role || (userData.isGuest ? UserRole.GUEST : UserRole.USER)
    });
    return user.save();
  }

  async updateById(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findOneAndUpdate(
      { id }, 
      { ...updateData, updatedAt: new Date() }, 
      { new: true }
    ).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  async getUsersPaginated(page: number = 1, limit: number = 10, search?: string, userType?: string) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    // 搜索条件
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // 用户类型过滤
    if (userType === 'guest') {
      filter.isGuest = true;
    } else if (userType === 'registered') {
      filter.isGuest = false;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .exec(),
      this.userModel.countDocuments(filter).exec()
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getGameStats() {
    const [totalUsers, activeUsers, guestUsers, registeredUsers, todayNewUsers, gameStats] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ isGuest: true }).exec(),
      this.userModel.countDocuments({ isGuest: false }).exec(),
      this.userModel.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }).exec(),
      this.userModel.aggregate([
        {
          $group: {
            _id: null,
            totalGames: { $sum: '$gamesPlayed' },
            totalPlayTime: { $sum: '$totalPlayTime' }
          }
        }
      ]).exec()
    ]);

    const stats = gameStats[0] || { totalGames: 0, totalPlayTime: 0 };
    const avgGameDuration = stats.totalGames > 0 ? (stats.totalPlayTime / stats.totalGames) : 0;

    return {
      totalUsers,
      activeUsers,
      guestUsers,
      registeredUsers,
      todayNewUsers,
      totalGames: stats.totalGames,
      todayGames: 0, // TODO: 实现今日游戏次数统计
      avgGameDuration: Math.round(avgGameDuration * 100) / 100,
      timestamp: new Date()
    };
  }

  async getRetentionStats() {
    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalNewUsers, day1Active, day3Active, day7Active, day30Active] = await Promise.all([
      this.userModel.countDocuments({
        createdAt: { $gte: day30 }
      }).exec(),
      this.userModel.countDocuments({
        createdAt: { $gte: day1, $lte: now },
        lastLoginAt: { $gte: day1 }
      }).exec(),
      this.userModel.countDocuments({
        createdAt: { $gte: day3, $lte: now },
        lastLoginAt: { $gte: day3 }
      }).exec(),
      this.userModel.countDocuments({
        createdAt: { $gte: day7, $lte: now },
        lastLoginAt: { $gte: day7 }
      }).exec(),
      this.userModel.countDocuments({
        createdAt: { $gte: day30, $lte: now },
        lastLoginAt: { $gte: day30 }
      }).exec()
    ]);

    return {
      day1Retention: totalNewUsers > 0 ? day1Active / totalNewUsers : 0,
      day3Retention: totalNewUsers > 0 ? day3Active / totalNewUsers : 0,
      day7Retention: totalNewUsers > 0 ? day7Active / totalNewUsers : 0,
      day30Retention: totalNewUsers > 0 ? day30Active / totalNewUsers : 0,
      totalNewUsers,
      timestamp: now
    };
  }
}