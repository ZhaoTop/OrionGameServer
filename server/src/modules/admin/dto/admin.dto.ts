import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, IsDate, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UserListQueryDto {
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 10, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '用户名搜索' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: '是否为游客' })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;

  @ApiPropertyOptional({ description: '是否激活' })
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class GameStatsDto {
  @ApiProperty({ description: '总用户数', example: 1000 })
  totalUsers: number;

  @ApiProperty({ description: '活跃用户数', example: 850 })
  activeUsers: number;

  @ApiProperty({ description: '游客用户数', example: 300 })
  guestUsers: number;

  @ApiProperty({ description: '注册用户数', example: 700 })
  registeredUsers: number;

  @ApiProperty({ description: '今日新增用户', example: 25 })
  todayNewUsers: number;

  @ApiProperty({ description: '总游戏次数', example: 50000 })
  totalGames: number;

  @ApiProperty({ description: '今日游戏次数', example: 1200 })
  todayGames: number;

  @ApiProperty({ description: '平均游戏时长（分钟）', example: 15 })
  avgGameDuration: number;
}

export class RetentionStatsDto {
  @ApiProperty({ description: '次日留存率', example: 0.65 })
  day1Retention: number;

  @ApiProperty({ description: '3日留存率', example: 0.45 })
  day3Retention: number;

  @ApiProperty({ description: '7日留存率', example: 0.32 })
  day7Retention: number;

  @ApiProperty({ description: '30日留存率', example: 0.18 })
  day30Retention: number;
}

export class UserDetailDto {
  @ApiProperty({ description: '用户ID' })
  id: string;

  @ApiProperty({ description: '用户名', required: false })
  username?: string;

  @ApiProperty({ description: '邮箱', required: false })
  email?: string;

  @ApiProperty({ description: '是否为游客' })
  isGuest: boolean;

  @ApiProperty({ description: '是否激活' })
  isActive: boolean;

  @ApiProperty({ description: '等级' })
  level: number;

  @ApiProperty({ description: '经验值' })
  experience: number;

  @ApiProperty({ description: '金币' })
  coins: number;

  @ApiProperty({ description: '宝石' })
  gems: number;

  @ApiProperty({ description: '总游戏时长（分钟）' })
  totalPlayTime: number;

  @ApiProperty({ description: '游戏次数' })
  gamesPlayed: number;

  @ApiProperty({ description: '胜利次数' })
  gamesWon: number;

  @ApiProperty({ description: '连续登录天数' })
  consecutiveLoginDays: number;

  @ApiProperty({ description: '最后登录时间' })
  lastLoginAt?: Date;

  @ApiProperty({ description: '注册时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}