import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength, Matches, IsUUID } from 'class-validator';

export class GuestLoginDto {
  @ApiProperty({
    description: '设备唯一标识符',
    example: 'b1a2c3d4-e5f6-7890-1234-56789abcdef0',
  })
  @IsUUID()
  deviceId: string;
}

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'player123',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'securepass123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, { message: '密码必须包含至少一个字母和一个数字' })
  password: string;

  @ApiProperty({
    description: '邮箱地址（可选）',
    example: 'player@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'player123',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'securepass123',
  })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: '请求是否成功', example: true })
  success: boolean;

  @ApiProperty({
    description: '用户信息和令牌',
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'b1a2c3d4-e5f6-7890-1234-56789abcdef0' },
          username: { type: 'string', example: 'player123' },
          isGuest: { type: 'boolean', example: false },
        },
      },
      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  data: {
    user: {
      id: string;
      username?: string;
      isGuest: boolean;
    };
    token: string;
    refreshToken: string;
  };
}