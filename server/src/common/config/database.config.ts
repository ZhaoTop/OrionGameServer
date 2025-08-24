import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/orion-game-server',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
}));