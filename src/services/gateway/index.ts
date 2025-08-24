import WebSocket from 'ws';
import { createServer } from 'http';
import { gatewayConfig } from '@/common/config';
import { createServiceLogger } from '@/common/logger';
import { DatabaseManager } from '@/common/database';
import { ConnectionManager } from './connection-manager';
import { MessageRouter } from './message-router';

const logger = createServiceLogger('Gateway');

export class GatewayServer {
  private httpServer;
  private wsServer: WebSocket.Server | null = null;
  private connectionManager: ConnectionManager;
  private messageRouter: MessageRouter;
  private databaseManager: DatabaseManager;

  constructor() {
    this.httpServer = createServer();
    this.databaseManager = DatabaseManager.getInstance();
    this.connectionManager = new ConnectionManager();
    this.messageRouter = new MessageRouter();
  }

  public async start(): Promise<void> {
    try {
      await this.databaseManager.connectAll();
      
      this.wsServer = new WebSocket.Server({
        server: this.httpServer,
        verifyClient: this.verifyClient.bind(this),
      });

      this.setupWebSocketHandlers();
      
      this.httpServer.listen(gatewayConfig.port, () => {
        logger.info(`Gateway Server started on port ${gatewayConfig.port}`);
      });

    } catch (error) {
      logger.error('Failed to start Gateway Server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.wsServer) {
        this.wsServer.close();
      }
      
      this.httpServer.close();
      await this.databaseManager.disconnectAll();
      
      logger.info('Gateway Server stopped');
    } catch (error) {
      logger.error('Failed to stop Gateway Server:', error);
      throw error;
    }
  }

  private verifyClient(info: { req: any }): boolean {
    // TODO: Implement token verification
    return true;
  }

  private setupWebSocketHandlers(): void {
    if (!this.wsServer) return;

    this.wsServer.on('connection', async (ws, req) => {
      try {
        const clientId = await this.connectionManager.addConnection(ws, req);
        logger.info(`Client connected: ${clientId}`);

        ws.on('message', async (data) => {
          await this.messageRouter.handleMessage(clientId, data);
        });

        ws.on('close', async () => {
          await this.connectionManager.removeConnection(clientId);
          logger.info(`Client disconnected: ${clientId}`);
        });

        ws.on('error', (error) => {
          logger.error(`WebSocket error for client ${clientId}:`, error);
        });

      } catch (error) {
        logger.error('Error handling new connection:', error);
        ws.close();
      }
    });
  }
}

if (require.main === module) {
  const server = new GatewayServer();
  
  process.on('SIGINT', async () => {
    logger.info('Shutting down Gateway Server...');
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