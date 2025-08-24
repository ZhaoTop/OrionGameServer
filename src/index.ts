import { logger } from '@/common/logger';
import { GatewayServer } from '@/services/gateway';
import { LoginServer } from '@/services/login';
import { LogicServer } from '@/services/logic';

interface ServerOptions {
  services?: ('gateway' | 'login' | 'logic')[];
}

export class OrionGameServer {
  private servers: Map<string, any> = new Map();
  private options: ServerOptions;

  constructor(options: ServerOptions = {}) {
    this.options = {
      services: options.services || ['gateway', 'login', 'logic'],
    };
  }

  public async start(): Promise<void> {
    logger.info('Starting OrionGameServer...');

    try {
      // Start services based on configuration
      if (this.options.services!.includes('gateway')) {
        const gateway = new GatewayServer();
        await gateway.start();
        this.servers.set('gateway', gateway);
      }

      if (this.options.services!.includes('login')) {
        const login = new LoginServer();
        await login.start();
        this.servers.set('login', login);
      }

      if (this.options.services!.includes('logic')) {
        const logic = new LogicServer();
        await logic.start();
        this.servers.set('logic', logic);
      }

      logger.info('OrionGameServer started successfully');
    } catch (error) {
      logger.error('Failed to start OrionGameServer:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    logger.info('Stopping OrionGameServer...');

    try {
      for (const [name, server] of this.servers.entries()) {
        logger.info(`Stopping ${name} server...`);
        await server.stop();
      }
      
      this.servers.clear();
      logger.info('OrionGameServer stopped successfully');
    } catch (error) {
      logger.error('Failed to stop OrionGameServer:', error);
      throw error;
    }
  }
}

// CLI entry point
if (require.main === module) {
  const servicesToStart = process.argv.slice(2);
  const validServices = ['gateway', 'login', 'logic'];
  
  const services = servicesToStart.length > 0 
    ? servicesToStart.filter(s => validServices.includes(s)) as any[]
    : ['gateway', 'login', 'logic'];

  const server = new OrionGameServer({ services });
  
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
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