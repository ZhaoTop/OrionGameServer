import express from 'express';
import { loginConfig } from '@/common/config';
import { createServiceLogger } from '@/common/logger';
import { DatabaseManager } from '@/common/database';
import { AuthController } from './auth-controller';
import { TokenService } from './token-service-simple';

const logger = createServiceLogger('Login');

export class LoginServer {
  private app: express.Application;
  private databaseManager: DatabaseManager;
  private authController: AuthController;
  private tokenService: TokenService;

  constructor() {
    this.app = express();
    this.databaseManager = DatabaseManager.getInstance();
    this.tokenService = new TokenService();
    this.authController = new AuthController(this.tokenService);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  public async start(): Promise<void> {
    try {
      await this.databaseManager.connectAll();
      
      this.app.listen(loginConfig.port, () => {
        logger.info(`Login Server started on port ${loginConfig.port}`);
      });

    } catch (error) {
      logger.error('Failed to start Login Server:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.databaseManager.disconnectAll();
      logger.info('Login Server stopped');
    } catch (error) {
      logger.error('Failed to stop Login Server:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, { 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      const dbStatus = this.databaseManager.getConnectionStatus();
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbStatus,
      });
    });

    // Auth routes
    this.app.post('/auth/guest-login', this.authController.guestLogin.bind(this.authController));
    this.app.post('/auth/register', this.authController.register.bind(this.authController));
    this.app.post('/auth/login', this.authController.login.bind(this.authController));
    this.app.post('/auth/bind-account', this.authController.bindAccount.bind(this.authController));
    this.app.post('/auth/refresh-token', this.authController.refreshToken.bind(this.authController));
    this.app.post('/auth/validate-token', this.authController.validateToken.bind(this.authController));
    this.app.post('/auth/logout', this.authController.logout.bind(this.authController));

    // Error handling middleware
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Request error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
      });
    });
  }
}

if (require.main === module) {
  const server = new LoginServer();
  
  process.on('SIGINT', async () => {
    logger.info('Shutting down Login Server...');
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