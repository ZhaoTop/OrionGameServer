import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  GuestLoginDto,
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('guest-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '游客登录',
    description: '使用设备ID进行游客登录，如果设备ID不存在则创建新的游客账户',
  })
  @ApiResponse({
    status: 200,
    description: '游客登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '设备ID格式错误',
  })
  async guestLogin(@Body() guestLoginDto: GuestLoginDto) {
    return this.authService.guestLogin(guestLoginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '用户注册',
    description: '创建新用户账户，用户名和密码为必填项，邮箱为可选项',
  })
  @ApiResponse({
    status: 201,
    description: '用户注册成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '注册信息格式错误',
  })
  @ApiResponse({
    status: 409,
    description: '用户名或邮箱已存在',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名（或邮箱）和密码进行登录认证',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '用户名或密码不能为空',
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '刷新访问令牌',
    description: '使用有效的刷新令牌获取新的访问令牌和刷新令牌',
  })
  @ApiResponse({
    status: 200,
    description: '令牌刷新成功',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '无效的刷新令牌',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '用户登出',
    description: '用户登出（目前为客户端处理）',
  })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '登出成功' },
      },
    },
  })
  async logout() {
    return {
      success: true,
      message: '登出成功',
    };
  }
}