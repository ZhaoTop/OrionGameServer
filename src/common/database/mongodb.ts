import mongoose from 'mongoose';
import { databaseConfig } from '@/common/config';
import { logger } from '@/common/logger';

export class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('MongoDB already connected');
      return;
    }

    try {
      await mongoose.connect(databaseConfig.mongodb.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        ...databaseConfig.mongodb.options,
      });

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      this.setupEventListeners();
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('MongoDB disconnection failed:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  private setupEventListeners(): void {
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      this.isConnected = true;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}