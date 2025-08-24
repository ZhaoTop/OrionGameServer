import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: 'OrionGameServer',
  version: '2.0.0',
  description: '分布式游戏服务器框架',
  port: parseInt(process.env.PORT || '3000'),
  environment: process.env.NODE_ENV || 'development',
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'orion-game-server-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 加密配置
  crypto: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  },

  // CORS配置
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:8080',
      'http://localhost:3000',
    ],
  },
}));