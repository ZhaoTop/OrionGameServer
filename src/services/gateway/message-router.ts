import { createServiceLogger } from '@/common/logger';
import { RedisConnection } from '@/common/database';
import { MessageType, IWebSocketMessage, REDIS_CHANNELS } from '@/common';
import { CryptoUtils, ValidationUtils } from '@/common/utils';

const logger = createServiceLogger('MessageRouter');

export class MessageRouter {
  private redis: RedisConnection;

  constructor() {
    this.redis = RedisConnection.getInstance();
    // Defer subscription setup to avoid async issues in constructor
    process.nextTick(() => {
      this.setupRedisSubscriptions().catch(error => {
        logger.error('Failed to setup Redis subscriptions:', error);
      });
    });
  }

  public async handleMessage(clientId: string, rawData: any): Promise<void> {
    try {
      const messageStr = rawData.toString();
      const message = await this.parseMessage(messageStr);
      
      logger.debug(`Received message from ${clientId}:`, { type: message.type });

      switch (message.type) {
        case MessageType.AUTH:
          await this.handleAuthMessage(clientId, message);
          break;
        case MessageType.CHAT:
          await this.handleChatMessage(clientId, message);
          break;
        case MessageType.GAME_ACTION:
          await this.handleGameAction(clientId, message);
          break;
        case MessageType.HEARTBEAT:
          await this.handleHeartbeat(clientId, message);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from ${clientId}:`, error);
      await this.sendErrorToClient(clientId, 'Invalid message format');
    }
  }

  private async parseMessage(messageStr: string): Promise<IWebSocketMessage> {
    try {
      let decryptedMessage = messageStr;
      
      // Try to decrypt if it looks encrypted
      if (messageStr.includes(':')) {
        try {
          decryptedMessage = CryptoUtils.decrypt(messageStr);
        } catch {
          // If decryption fails, assume it's not encrypted
        }
      }

      const parsed = JSON.parse(decryptedMessage);
      
      if (!parsed.type || !parsed.payload) {
        throw new Error('Invalid message structure');
      }

      return {
        id: parsed.id || Date.now().toString(),
        type: parsed.type,
        payload: parsed.payload,
        timestamp: new Date(parsed.timestamp || Date.now()),
        encrypted: messageStr !== decryptedMessage,
      };
    } catch (error) {
      throw new Error(`Message parsing failed: ${(error as Error).message}`);
    }
  }

  private async handleAuthMessage(clientId: string, message: IWebSocketMessage): Promise<void> {
    try {
      const { token } = message.payload as { token: string };
      
      if (!token) {
        throw new Error('Token is required');
      }

      // Forward to login service for validation
      await this.forwardToService('login', {
        action: 'validate_token',
        clientId,
        token,
      });
      
    } catch (error) {
      logger.error(`Auth error for client ${clientId}:`, error);
      await this.sendErrorToClient(clientId, 'Authentication failed');
    }
  }

  private async handleChatMessage(clientId: string, message: IWebSocketMessage): Promise<void> {
    try {
      const payload = message.payload as {
        type: 'global' | 'private';
        content: string;
        targetUserId?: string;
      };

      // Validate message content
      if (!payload.content || payload.content.trim().length === 0) {
        throw new Error('Message content is required');
      }

      payload.content = ValidationUtils.sanitizeString(payload.content);

      // Forward to logic service
      await this.forwardToService('logic', {
        action: 'chat_message',
        clientId,
        payload,
      });
      
    } catch (error) {
      logger.error(`Chat error for client ${clientId}:`, error);
      await this.sendErrorToClient(clientId, 'Failed to send chat message');
    }
  }

  private async handleGameAction(clientId: string, message: IWebSocketMessage): Promise<void> {
    try {
      // Forward all game actions to logic service
      await this.forwardToService('logic', {
        action: 'game_action',
        clientId,
        payload: message.payload,
      });
      
    } catch (error) {
      logger.error(`Game action error for client ${clientId}:`, error);
      await this.sendErrorToClient(clientId, 'Game action failed');
    }
  }

  private async handleHeartbeat(clientId: string, message: IWebSocketMessage): Promise<void> {
    // Simply respond with heartbeat
    await this.sendToClient(clientId, {
      id: Date.now().toString(),
      type: MessageType.HEARTBEAT,
      payload: { timestamp: Date.now() },
      timestamp: new Date(),
    });
  }

  private async forwardToService(serviceName: string, data: unknown): Promise<void> {
    const channel = `service:${serviceName}:request`;
    await this.redis.publish(channel, JSON.stringify(data));
  }

  private async sendToClient(clientId: string, message: IWebSocketMessage): Promise<void> {
    // Send message via Redis pub/sub to connection manager
    await this.redis.publish(`client:${clientId}:message`, JSON.stringify(message));
  }

  private async sendErrorToClient(clientId: string, errorMessage: string): Promise<void> {
    await this.sendToClient(clientId, {
      id: Date.now().toString(),
      type: MessageType.SYSTEM,
      payload: { error: errorMessage },
      timestamp: new Date(),
    });
  }

  private async setupRedisSubscriptions(): Promise<void> {
    try {
      // Subscribe to global chat messages
      await this.redis.subscribe(REDIS_CHANNELS.GLOBAL_CHAT, async (message) => {
        try {
          const chatMessage = JSON.parse(message);
          // Broadcast to all connected clients
          await this.redis.publish('gateway:broadcast', message);
        } catch (error) {
          logger.error('Error handling global chat message:', error);
        }
      });

      // Subscribe to private chat messages
      await this.redis.subscribe(REDIS_CHANNELS.PRIVATE_CHAT, async (message) => {
        try {
          const chatMessage = JSON.parse(message);
          const { targetUserId, ...messageData } = chatMessage;
          
          // Send to specific user
          await this.redis.publish(`user:${targetUserId}:message`, 
            JSON.stringify(messageData));
        } catch (error) {
          logger.error('Error handling private chat message:', error);
        }
      });

      // Subscribe to system broadcasts
      await this.redis.subscribe(REDIS_CHANNELS.SYSTEM_BROADCAST, async (message) => {
        try {
          // Broadcast system messages to all clients
          await this.redis.publish('gateway:broadcast', message);
        } catch (error) {
          logger.error('Error handling system broadcast:', error);
        }
      });

      logger.info('Redis subscriptions setup completed');
    } catch (error) {
      logger.error('Failed to setup Redis subscriptions:', error);
      throw error;
    }
  }
}