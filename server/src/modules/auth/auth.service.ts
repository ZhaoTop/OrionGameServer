import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { GuestLoginDto, RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async guestLogin(guestLoginDto: GuestLoginDto) {
    const { deviceId } = guestLoginDto;

    let user = await this.userService.findByDeviceId(deviceId);

    if (!user) {
      user = await this.userService.create({
        id: uuidv4(),
        deviceId,
        isGuest: true,
        role: UserRole.GUEST,
        lastLoginAt: new Date(),
      });
    } else {
      user = await this.userService.updateById(user.id, {
        lastLoginAt: new Date(),
      });
    }

    if (!user) {
      throw new Error('用户创建或更新失败');
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          isGuest: user.isGuest,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, email } = registerDto;

    // 检查用户名是否已存在
    const existingUserByUsername = await this.userService.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingUserByEmail = await this.userService.findByEmail(email);
      if (existingUserByEmail) {
        throw new ConflictException('邮箱已存在');
      }
    }

    // 创建新用户
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await this.userService.create({
      id: uuidv4(),
      username,
      password: hashedPassword,
      email,
      isGuest: false,
      role: UserRole.USER,
      coins: 100, // 新用户奖励
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isGuest: user.isGuest,
          role: user.role,
        },
        ...tokens,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 支持用户名或邮箱登录
    let user = await this.userService.findByUsername(username);
    if (!user) {
      user = await this.userService.findByEmail(username);
    }

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户是否被禁用
    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 验证密码
    if (!user.password) {
      throw new UnauthorizedException('用户密码未设置');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新最后登录时间
    await this.userService.updateById(user.id, {
      lastLoginAt: new Date(),
    });

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isGuest: user.isGuest,
          role: user.role,
          level: user.level,
          experience: user.experience,
          coins: user.coins,
          gems: user.gems,
        },
        ...tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 
                this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const tokens = await this.generateTokens(user.id, user.role);

      return {
        success: true,
        data: tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('无效的刷新令牌');
    }
  }

  async validateUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  }

  private async generateTokens(userId: string, role: UserRole) {
    const payload = { 
      sub: userId, 
      role: role,
      timestamp: Date.now() 
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 
              this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      token: accessToken,
      refreshToken,
    };
  }
}