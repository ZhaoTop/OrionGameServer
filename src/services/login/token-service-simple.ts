import jwt from 'jsonwebtoken';
import { authConfig } from '@/common/config';
import { createServiceLogger } from '@/common/logger';

const logger = createServiceLogger('TokenService');

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class TokenService {
  public generateAccessToken(userId: string): string {
    try {
      const payload = {
        userId,
        type: 'access',
      };

      const options = {
        expiresIn: authConfig.jwt.expiresIn,
      } as jwt.SignOptions;

      return jwt.sign(payload, authConfig.jwt.secret, options);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Token generation failed');
    }
  }

  public generateRefreshToken(userId: string): string {
    try {
      const payload = {
        userId,
        type: 'refresh',
      };

      const options = {
        expiresIn: authConfig.jwt.refreshExpiresIn,
      } as jwt.SignOptions;

      return jwt.sign(payload, authConfig.jwt.secret, options);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Token generation failed');
    }
  }

  public verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, authConfig.jwt.secret) as any;

      if (payload.type !== 'access') {
        logger.warn('Invalid token type for access token verification');
        return null;
      }

      return payload;
    } catch (error) {
      logger.debug('Invalid access token:', error);
      return null;
    }
  }

  public verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const payload = jwt.verify(token, authConfig.jwt.secret) as any;

      if (payload.type !== 'refresh') {
        logger.warn('Invalid token type for refresh token verification');
        return null;
      }

      return payload;
    } catch (error) {
      logger.debug('Invalid refresh token:', error);
      return null;
    }
  }

  public decodeToken(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }
}