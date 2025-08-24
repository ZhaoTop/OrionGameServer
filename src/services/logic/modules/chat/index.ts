import { createServiceLogger } from '@/common/logger';
import { RedisConnection } from '@/common/database';
import { REDIS_CHANNELS, ChatType } from '@/common';
import { ValidationUtils } from '@/common/utils';

const logger = createServiceLogger('ChatModule');

interface ChatPayload {
  type: 'global' | 'private';
  content: string;
  targetUserId?: string;
}

export class ChatModule {
  private redis: RedisConnection;

  constructor() {
    this.redis = RedisConnection.getInstance();
  }

  public async handleChatMessage(clientId: string, payload: ChatPayload): Promise<void> {
    try {
      const { type, content, targetUserId } = payload;

      // Validate message content
      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      if (content.length > 500) {
        throw new Error('Message content too long (max 500 characters)');
      }

      // Sanitize content
      const sanitizedContent = ValidationUtils.sanitizeString(content);

      // Get user info from Redis session
      const userSession = await this.getUserSession(clientId);
      if (!userSession) {
        throw new Error('User session not found');
      }

      const chatMessage = {
        id: Date.now().toString(),
        fromUserId: userSession.userId,
        fromUsername: userSession.username || 'Guest',
        content: sanitizedContent,
        type: type === 'global' ? ChatType.GLOBAL : ChatType.PRIVATE,
        timestamp: new Date().toISOString(),
      };

      if (type === 'global') {
        await this.handleGlobalChat(chatMessage);
      } else if (type === 'private' && targetUserId) {
        await this.handlePrivateChat(chatMessage, targetUserId);
      } else {
        throw new Error('Invalid chat message type or missing target user');
      }

      logger.info(`Chat message processed: ${type} from ${userSession.userId}`);
    } catch (error) {
      logger.error(`Error handling chat message from ${clientId}:`, error);
      throw error;
    }
  }

  private async handleGlobalChat(chatMessage: any): Promise<void> {
    try {
      // Rate limiting check (simple implementation)
      const rateLimitKey = `chat_rate_limit:${chatMessage.fromUserId}`;
      const currentCount = await this.redis.get(rateLimitKey);
      
      if (currentCount && parseInt(currentCount) >= 10) {
        throw new Error('Rate limit exceeded. Please slow down.');
      }

      // Increment rate limit counter
      await this.redis.set(rateLimitKey, (parseInt(currentCount || '0') + 1).toString(), 60);

      // Publish to global chat channel
      await this.redis.publish(REDIS_CHANNELS.GLOBAL_CHAT, JSON.stringify(chatMessage));
      
      logger.debug(`Global chat message published: ${chatMessage.id}`);
    } catch (error) {
      logger.error('Error handling global chat:', error);
      throw error;
    }
  }

  private async handlePrivateChat(chatMessage: any, targetUserId: string): Promise<void> {
    try {
      // Check if target user exists and is online
      const targetUserSession = await this.redis.get(`user:${targetUserId}:connection`);
      if (!targetUserSession) {
        throw new Error('Target user is not online');
      }

      // Add target user ID to message
      const privateMessage = {
        ...chatMessage,
        targetUserId,
      };

      // Publish to private chat channel
      await this.redis.publish(REDIS_CHANNELS.PRIVATE_CHAT, JSON.stringify(privateMessage));
      
      logger.debug(`Private chat message sent: ${chatMessage.id} to ${targetUserId}`);
    } catch (error) {
      logger.error('Error handling private chat:', error);
      throw error;
    }
  }

  private async getUserSession(clientId: string): Promise<{ userId: string; username?: string } | null> {
    try {
      // This would typically get user info from the connection manager
      // For now, we'll simulate getting it from Redis
      const sessionData = await this.redis.get(`client:${clientId}:session`);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (error) {
      logger.error('Error getting user session:', error);
      return null;
    }
  }

  public async getRecentMessages(chatType: ChatType, limit: number = 50): Promise<any[]> {
    try {
      // This would typically retrieve from a message history store
      // For now, return empty array as this is a simple implementation
      return [];
    } catch (error) {
      logger.error('Error getting recent messages:', error);
      return [];
    }
  }
}