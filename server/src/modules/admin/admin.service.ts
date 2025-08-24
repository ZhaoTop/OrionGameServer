import { Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { UserListQueryDto, GameStatsDto, RetentionStatsDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
  ) {}

  async getUserList(query: UserListQueryDto) {
    const { page = 1, limit = 10, username, isGuest, isActive } = query;
    
    // 构建搜索条件
    let search = username;
    let userType: string | undefined;
    
    if (typeof isGuest === 'boolean') {
      userType = isGuest ? 'guest' : 'registered';
    }

    return this.userService.getUsersPaginated(page, limit, search, userType);
  }

  async getUserDetail(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          deviceId: user.deviceId,
          isGuest: user.isGuest,
          isActive: user.isActive,
          role: user.role,
          level: user.level,
          experience: user.experience,
          coins: user.coins,
          gems: user.gems,
          totalPlayTime: user.totalPlayTime,
          gamesPlayed: user.gamesPlayed,
          gamesWon: user.gamesWon,
          daysSinceFirstLogin: user.daysSinceFirstLogin,
          totalLoginDays: user.totalLoginDays,
          consecutiveLoginDays: user.consecutiveLoginDays,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      }
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userService.updateById(userId, { isActive });

    return {
      success: true,
      message: '用户状态更新成功',
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const deleted = await this.userService.deleteById(userId);
    if (!deleted) {
      throw new Error('删除用户失败');
    }

    return {
      success: true,
      message: '用户删除成功',
    };
  }

  async getGameStats(): Promise<GameStatsDto> {
    return this.userService.getGameStats();
  }

  async getRetentionStats(): Promise<RetentionStatsDto> {
    return this.userService.getRetentionStats();
  }
}