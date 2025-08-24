import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createServiceLogger } from '@/common/logger';
import { ValidationUtils } from '@/common/utils';
import { authConfig, HTTP_STATUS, ERROR_CODES } from '@/common';
import { TokenService } from './token-service-simple';
import { UserModel } from './models/user-model';

const logger = createServiceLogger('AuthController');

export class AuthController {
  constructor(private tokenService: TokenService) {}

  public async guestLogin(req: Request, res: Response): Promise<void> {
    try {
      const { deviceId } = req.body;

      if (!deviceId || !ValidationUtils.isValidUUID(deviceId)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Valid device ID is required',
        });
        return;
      }

      let user = await UserModel.findOne({ deviceId }).exec();
      
      if (!user) {
        user = new UserModel({
          id: uuidv4(),
          deviceId,
          isGuest: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await user.save();
      } else {
        user.updatedAt = new Date();
        await user.save();
      }

      const token = this.tokenService.generateAccessToken(user.id);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: {
            id: user.id,
            isGuest: user.isGuest,
            username: user.username,
          },
          token,
          refreshToken,
        },
      });

      logger.info(`Guest login successful for device: ${deviceId}`);
    } catch (error) {
      logger.error('Guest login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Guest login failed',
      });
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, email } = req.body;

      if (!username || !ValidationUtils.isValidUsername(username)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Valid username (3-20 alphanumeric characters) is required',
        });
        return;
      }

      if (!password || !ValidationUtils.isValidPassword(password)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Password must be at least 8 characters with letters and numbers',
        });
        return;
      }

      if (email && !ValidationUtils.isValidEmail(email)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Valid email is required',
        });
        return;
      }

      const existingUser = await UserModel.findOne({ username }).exec();
      if (existingUser) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Username already exists',
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.rounds);
      
      const user = new UserModel({
        id: uuidv4(),
        username,
        password: hashedPassword,
        email,
        isGuest: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await user.save();

      const token = this.tokenService.generateAccessToken(user.id);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest,
          },
          token,
          refreshToken,
        },
      });

      logger.info(`User registration successful: ${username}`);
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Registration failed',
      });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Username and password are required',
        });
        return;
      }

      const user = await UserModel.findOne({ username }).exec();
      if (!user || !user.password) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid username or password',
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid username or password',
        });
        return;
      }

      user.updatedAt = new Date();
      await user.save();

      const token = this.tokenService.generateAccessToken(user.id);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest,
          },
          token,
          refreshToken,
        },
      });

      logger.info(`User login successful: ${username}`);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Login failed',
      });
    }
  }

  public async bindAccount(req: Request, res: Response): Promise<void> {
    try {
      const { guestToken, username, password } = req.body;

      if (!guestToken || !username || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Guest token, username and password are required',
        });
        return;
      }

      const payload = this.tokenService.verifyAccessToken(guestToken);
      if (!payload) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid guest token',
        });
        return;
      }

      const user = await UserModel.findOne({ id: payload.userId }).exec();
      if (!user || !user.isGuest) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'Guest user not found',
        });
        return;
      }

      if (!ValidationUtils.isValidUsername(username) || !ValidationUtils.isValidPassword(password)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid username or password format',
        });
        return;
      }

      const existingUser = await UserModel.findOne({ username }).exec();
      if (existingUser) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Username already exists',
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, authConfig.bcrypt.rounds);
      
      user.username = username;
      user.password = hashedPassword;
      user.isGuest = false;
      user.updatedAt = new Date();
      await user.save();

      const token = this.tokenService.generateAccessToken(user.id);
      const refreshToken = this.tokenService.generateRefreshToken(user.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest,
          },
          token,
          refreshToken,
        },
      });

      logger.info(`Account binding successful: ${username}`);
    } catch (error) {
      logger.error('Account binding error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.DATABASE_ERROR,
        message: 'Account binding failed',
      });
    }
  }

  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Refresh token is required',
        });
        return;
      }

      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid refresh token',
        });
        return;
      }

      const user = await UserModel.findOne({ id: payload.userId }).exec();
      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      const newToken = this.tokenService.generateAccessToken(user.id);
      const newRefreshToken = this.tokenService.generateRefreshToken(user.id);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });

      logger.info(`Token refresh successful for user: ${user.id}`);
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Token refresh failed',
      });
    }
  }

  public async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Token is required',
        });
        return;
      }

      const payload = this.tokenService.verifyAccessToken(token);
      if (!payload) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.INVALID_TOKEN,
          message: 'Invalid or expired token',
        });
        return;
      }

      const user = await UserModel.findOne({ id: payload.userId }).exec();
      if (!user) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          code: ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        });
        return;
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            isGuest: user.isGuest,
          },
          valid: true,
        },
      });

      logger.debug(`Token validation successful for user: ${user.id}`);
    } catch (error) {
      logger.error('Token validation error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: ERROR_CODES.INVALID_TOKEN,
        message: 'Token validation failed',
      });
    }
  }

  public async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, we would invalidate the token
      // For now, we just return success
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Logout successful',
      });

      logger.info('User logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
}