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
      const payload: TokenPayload = {
        userId,
        type: 'access',
      };

      const options = {
        expiresIn: authConfig.jwt.expiresIn,
        issuer: 'orion-game-server',
        audience: 'orion-game-client',
      } as jwt.SignOptions;

      return jwt.sign(payload, authConfig.jwt.secret, options);
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Token generation failed');
    }
  }

  public generateRefreshToken(userId: string): string {
    try {
      const payload: TokenPayload = {
        userId,
        type: 'refresh',
      };

      const options = {
        expiresIn: authConfig.jwt.refreshExpiresIn,
        issuer: 'orion-game-server',
        audience: 'orion-game-client',
      } as jwt.SignOptions;

      return jwt.sign(payload, authConfig.jwt.secret, options);
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Token generation failed');
    }
  }

  public verifyAccessToken(token: string): TokenPayload | null {
    try {
      const options: jwt.VerifyOptions = {
        issuer: 'orion-game-server',
        audience: 'orion-game-client',
      };

      const payload = jwt.verify(token, authConfig.jwt.secret, options) as TokenPayload;

      if (payload.type !== 'access') {
        logger.warn('Invalid token type for access token verification');
        return null;
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid access token:', error.message);
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Access token expired');
      } else {
        logger.error('Error verifying access token:', error);
      }
      return null;
    }
  }

  public verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const options: jwt.VerifyOptions = {
        issuer: 'orion-game-server',
        audience: 'orion-game-client',
      };

      const payload = jwt.verify(token, authConfig.jwt.secret, options) as TokenPayload;

      if (payload.type !== 'refresh') {
        logger.warn('Invalid token type for refresh token verification');
        return null;
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid refresh token:', error.message);
      } else if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Refresh token expired');
      } else {
        logger.error('Error verifying refresh token:', error);
      }
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

  public getTokenExpirationDate(token: string): Date | null {
    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) {
        return null;
      }
      
      return new Date(payload.exp * 1000);
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) {
      return true;
    }
    
    return expirationDate <= new Date();
  }
}