import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'OrionGameServer is running!',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '2.0.0',
    };
  }
}
