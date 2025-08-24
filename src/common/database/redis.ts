import Redis from 'ioredis';
import { databaseConfig } from '@/common/config';
import { logger } from '@/common/logger';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis | null = null;
  private subscriber: Redis | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Redis already connected');
      return;
    }

    try {
      const redisConfig: any = {
        host: databaseConfig.redis.host,
        port: databaseConfig.redis.port,
        db: databaseConfig.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      };

      if (databaseConfig.redis.password) {
        redisConfig.password = databaseConfig.redis.password;
      }

      this.client = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);

      await Promise.all([this.client.connect(), this.subscriber.connect()]);

      this.isConnected = true;
      logger.info('Redis connected successfully');

      this.setupEventListeners();
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }

      if (this.subscriber) {
        await this.subscriber.quit();
        this.subscriber = null;
      }

      this.isConnected = false;
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
      throw error;
    }
  }

  public getClient(): Redis {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  public getSubscriber(): Redis {
    if (!this.subscriber || !this.isConnected) {
      throw new Error('Redis subscriber is not connected');
    }
    return this.subscriber;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && 
           this.client?.status === 'ready' && 
           this.subscriber?.status === 'ready';
  }

  public async set(
    key: string, 
    value: string, 
    ttlSeconds?: number
  ): Promise<void> {
    const client = this.getClient();
    
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  public async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return await client.get(key);
  }

  public async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const client = this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  public async publish(channel: string, message: string): Promise<void> {
    const client = this.getClient();
    await client.publish(channel, message);
  }

  public async subscribe(
    channel: string, 
    callback: (message: string) => void
  ): Promise<void> {
    const subscriber = this.getSubscriber();
    
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(message);
      }
    });

    await subscriber.subscribe(channel);
  }

  public async unsubscribe(channel: string): Promise<void> {
    const subscriber = this.getSubscriber();
    await subscriber.unsubscribe(channel);
  }

  private setupEventListeners(): void {
    const setupClientListeners = (client: Redis, name: string): void => {
      client.on('error', (error) => {
        logger.error(`Redis ${name} error:`, error);
      });

      client.on('connect', () => {
        logger.info(`Redis ${name} connected`);
      });

      client.on('ready', () => {
        logger.info(`Redis ${name} ready`);
      });

      client.on('close', () => {
        logger.warn(`Redis ${name} connection closed`);
        this.isConnected = false;
      });

      client.on('reconnecting', () => {
        logger.info(`Redis ${name} reconnecting`);
      });
    };

    if (this.client) {
      setupClientListeners(this.client, 'client');
    }

    if (this.subscriber) {
      setupClientListeners(this.subscriber, 'subscriber');
    }

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }
}