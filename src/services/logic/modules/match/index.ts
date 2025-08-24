import { createServiceLogger } from '@/common/logger';
import { RedisConnection } from '@/common/database';

const logger = createServiceLogger('MatchModule');

interface MatchRequest {
  gameMode: string;
  playerCount: number;
  skillLevel?: number;
}

export class MatchModule {
  private redis: RedisConnection;
  private matchQueues: Map<string, string[]> = new Map();

  constructor() {
    this.redis = RedisConnection.getInstance();
  }

  public async handleMatchRequest(clientId: string, payload: MatchRequest): Promise<void> {
    try {
      const { gameMode, playerCount, skillLevel } = payload;

      // Validate match request
      if (!gameMode || !playerCount || playerCount < 1 || playerCount > 8) {
        throw new Error('Invalid match request parameters');
      }

      // Get user session
      const userSession = await this.getUserSession(clientId);
      if (!userSession) {
        throw new Error('User session not found');
      }

      // Add to match queue
      await this.addToMatchQueue(userSession.userId, gameMode, playerCount, skillLevel);
      
      // Try to find a match
      await this.tryFindMatch(gameMode, playerCount);

      logger.info(`Match request processed for user: ${userSession.userId}`);
    } catch (error) {
      logger.error(`Error handling match request from ${clientId}:`, error);
      throw error;
    }
  }

  private async addToMatchQueue(
    userId: string, 
    gameMode: string, 
    playerCount: number, 
    skillLevel?: number
  ): Promise<void> {
    try {
      const queueKey = `match_queue:${gameMode}:${playerCount}`;
      const playerData = {
        userId,
        skillLevel: skillLevel || 1000,
        timestamp: Date.now(),
      };

      // Add to Redis set for persistence across server instances
      await this.redis.getClient().sadd(queueKey, JSON.stringify(playerData));
      
      logger.debug(`Added user ${userId} to match queue: ${queueKey}`);
    } catch (error) {
      logger.error('Error adding to match queue:', error);
      throw error;
    }
  }

  private async tryFindMatch(gameMode: string, playerCount: number): Promise<void> {
    try {
      const queueKey = `match_queue:${gameMode}:${playerCount}`;
      const queuedPlayers = await this.redis.getClient().smembers(queueKey);

      if (queuedPlayers.length >= playerCount) {
        // Select players for match (simple FIFO for now)
        const selectedPlayers = queuedPlayers
          .map(playerStr => JSON.parse(playerStr))
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, playerCount);

        // Create match
        const matchId = await this.createMatch(selectedPlayers, gameMode);

        // Remove selected players from queue
        for (const player of selectedPlayers) {
          await this.redis.getClient().srem(queueKey, JSON.stringify(player));
        }

        // Notify players about match found
        await this.notifyMatchFound(selectedPlayers, matchId);

        logger.info(`Match created: ${matchId} with ${selectedPlayers.length} players`);
      }
    } catch (error) {
      logger.error('Error finding match:', error);
      throw error;
    }
  }

  private async createMatch(players: any[], gameMode: string): Promise<string> {
    try {
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const matchData = {
        id: matchId,
        gameMode,
        players: players.map(p => p.userId),
        status: 'waiting',
        createdAt: new Date().toISOString(),
      };

      // Store match data
      await this.redis.set(`match:${matchId}`, JSON.stringify(matchData), 3600); // 1 hour TTL

      return matchId;
    } catch (error) {
      logger.error('Error creating match:', error);
      throw error;
    }
  }

  private async notifyMatchFound(players: any[], matchId: string): Promise<void> {
    try {
      for (const player of players) {
        const notification = {
          type: 'match_found',
          matchId,
          players: players.map(p => p.userId),
          timestamp: Date.now(),
        };

        // Publish notification to user's channel
        await this.redis.publish(
          `user:${player.userId}:message`, 
          JSON.stringify(notification)
        );
      }
    } catch (error) {
      logger.error('Error notifying match found:', error);
      throw error;
    }
  }

  public async cancelMatchRequest(clientId: string): Promise<void> {
    try {
      const userSession = await this.getUserSession(clientId);
      if (!userSession) {
        throw new Error('User session not found');
      }

      // Remove from all possible queues (this is a simplified approach)
      const queuePattern = 'match_queue:*';
      const queues = await this.redis.getClient().keys(queuePattern);

      for (const queueKey of queues) {
        const queuedPlayers = await this.redis.getClient().smembers(queueKey);
        
        for (const playerStr of queuedPlayers) {
          const player = JSON.parse(playerStr);
          if (player.userId === userSession.userId) {
            await this.redis.getClient().srem(queueKey, playerStr);
            logger.info(`Removed user ${userSession.userId} from queue: ${queueKey}`);
          }
        }
      }
    } catch (error) {
      logger.error('Error canceling match request:', error);
      throw error;
    }
  }

  private async getUserSession(clientId: string): Promise<{ userId: string } | null> {
    try {
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
}