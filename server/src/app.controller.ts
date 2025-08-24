import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '健康检查',
    description: '检查服务器运行状态',
  })
  @ApiResponse({
    status: 200,
    description: '服务器运行正常',
    schema: {
      properties: {
        message: { type: 'string', example: 'OrionGameServer is running!' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        version: { type: 'string', example: '2.0.0' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: '系统健康状态',
    description: '获取详细的系统健康状态信息',
  })
  @ApiResponse({
    status: 200,
    description: '系统健康状态',
    schema: {
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 3600 },
        version: { type: 'string', example: '2.0.0' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
