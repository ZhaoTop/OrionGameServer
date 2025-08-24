export * from './mongodb';
export * from './redis';

import { MongoDBConnection } from './mongodb';
import { RedisConnection } from './redis';
import { logger } from '@/common/logger';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private mongodb: MongoDBConnection;
  private redis: RedisConnection;

  private constructor() {
    this.mongodb = MongoDBConnection.getInstance();
    this.redis = RedisConnection.getInstance();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectAll(): Promise<void> {
    try {
      await Promise.all([
        this.mongodb.connect(),
        this.redis.connect(),
      ]);
      
      logger.info('All database connections established successfully');
    } catch (error) {
      logger.error('Failed to establish database connections:', error);
      throw error;
    }
  }

  public async disconnectAll(): Promise<void> {
    try {
      await Promise.all([
        this.mongodb.disconnect(),
        this.redis.disconnect(),
      ]);
      
      logger.info('All database connections closed successfully');
    } catch (error) {
      logger.error('Failed to close database connections:', error);
      throw error;
    }
  }

  public getMongoDBConnection(): MongoDBConnection {
    return this.mongodb;
  }

  public getRedisConnection(): RedisConnection {
    return this.redis;
  }

  public getConnectionStatus(): { mongodb: boolean; redis: boolean } {
    return {
      mongodb: this.mongodb.getConnectionStatus(),
      redis: this.redis.getConnectionStatus(),
    };
  }
}