import {
  Controller,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UseGuards,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UserListQueryDto, GameStatsDto, RetentionStatsDto, UserDetailDto } from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({
    summary: '获取用户列表',
    description: '分页获取用户列表，支持按用户名、游客状态、激活状态筛选',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户列表成功',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserDetailDto' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 100 },
                pages: { type: 'number', example: 10 },
              },
            },
          },
        },
      },
    },
  })
  async getUserList(@Query() query: UserListQueryDto) {
    return this.adminService.getUserList(query);
  }

  @Get('users/:userId')
  @ApiOperation({
    summary: '获取用户详情',
    description: '根据用户ID获取用户的详细信息',
  })
  @ApiResponse({
    status: 200,
    description: '获取用户详情成功',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/UserDetailDto' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Get('stats/game')
  @ApiOperation({
    summary: '获取游戏统计数据',
    description: '获取游戏相关的统计数据，包括用户数、游戏次数等',
  })
  @ApiResponse({
    status: 200,
    description: '获取游戏统计数据成功',
    type: GameStatsDto,
  })
  async getGameStats() {
    const stats = await this.adminService.getGameStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('stats/retention')
  @ApiOperation({
    summary: '获取用户留存统计',
    description: '获取用户在不同时间段的留存率数据',
  })
  @ApiResponse({
    status: 200,
    description: '获取留存统计成功',
    type: RetentionStatsDto,
  })
  async getRetentionStats() {
    const stats = await this.adminService.getRetentionStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Patch('users/:userId/status')
  @ApiOperation({
    summary: '更新用户状态',
    description: '激活或禁用用户账户',
  })
  @ApiResponse({
    status: 200,
    description: '用户状态更新成功',
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.updateUserStatus(userId, body.isActive);
  }

  @Delete('users/:userId')
  @ApiOperation({
    summary: '删除用户',
    description: '永久删除用户账户（谨慎操作）',
  })
  @ApiResponse({
    status: 200,
    description: '用户删除成功',
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
  })
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}