import { logicConfig } from '@/common/config';
import { createServiceLogger } from '@/common/logger';
import { DatabaseManager, RedisConnection } from '@/common/database';
import { ChatModule } from './modules/chat';
import { MatchModule } from './modules/match';

const logger = createServiceLogger('Logic');

export class LogicServer {
  private databaseManager: DatabaseManager;
  private redis: RedisConnection;
  private chatModule: ChatModule;
  private matchModule: MatchModule;

  constructor() {
    this.databaseManager = DatabaseManager.getInstance();
    this.redis = RedisConnection.getInstance();
    this.chatModule = new ChatModule();
    this.matchModule = new MatchModule();
  }

  public async start(): Promise<void> {
    try {
      await this.databaseManager.connectAll();
      this.setupMessageHandlers();
      
      logger.info(`Logic Server started`);
    } catch (error) {
      logger.error('Failed to start Logic Server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.databaseManager.disconnectAll();
      logger.info('Logic Server stopped');
    } catch (error) {
      logger.error('Failed to stop Logic Server:', error);
      throw error;
    }
  }

  private setupMessageHandlers(): void {
    // Subscribe to service requests
    this.redis.subscribe('service:logic:request', async (message) => {
      try {
        const request = JSON.parse(message);
        await this.handleServiceRequest(request);
      } catch (error) {
        logger.error('Error handling service request:', error);
      }
    });
  }

  private async handleServiceRequest(request: any): Promise<void> {
    const { action, clientId, payload } = request;

    try {
      switch (action) {
        case 'chat_message':
          await this.chatModule.handleChatMessage(clientId, payload);
          break;
        case 'game_action':
          await this.handleGameAction(clientId, payload);
          break;
        default:
          logger.warn(`Unknown action: ${action}`);
      }
    } catch (error) {
      logger.error(`Error handling action ${action}:`, error);
    }
  }

  private async handleGameAction(clientId: string, payload: any): Promise<void> {
    // Route game actions to appropriate modules
    const { type } = payload;

    switch (type) {
      case 'match_request':
        await this.matchModule.handleMatchRequest(clientId, payload);
        break;
      default:
        logger.warn(`Unknown game action type: ${type}`);
    }
  }
}

if (require.main === module) {
  const server = new LogicServer();
  
  process.on('SIGINT', async () => {
    logger.info('Shutting down Logic Server...');
    await server.stop();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}