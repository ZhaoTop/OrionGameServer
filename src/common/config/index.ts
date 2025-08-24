import { config } from 'dotenv';
import {
  IServerConfig,
  IDatabaseConfig,
  IAuthConfig,
  ISecurityConfig,
  ILoggerConfig,
} from '@/common/interfaces';
import { DEFAULT_CONFIG } from '@/common/constants';

config();

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

export const serverConfig: IServerConfig = {
  port: getEnvNumber('PORT', 3000),
  host: process.env.HOST,
};

export const gatewayConfig: IServerConfig = {
  port: getEnvNumber('GATEWAY_PORT', 8080),
  host: process.env.GATEWAY_HOST,
};

export const loginConfig: IServerConfig = {
  port: getEnvNumber('LOGIN_PORT', 3001),
  host: process.env.LOGIN_HOST,
};

export const logicConfig: IServerConfig = {
  port: getEnvNumber('LOGIC_PORT', 3002),
  host: process.env.LOGIC_HOST,
};

export const databaseConfig: IDatabaseConfig = {
  mongodb: {
    uri: getEnvVar('MONGODB_URI'),
  },
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
    db: getEnvNumber('REDIS_DB', 0),
  },
};

export const authConfig: IAuthConfig = {
  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', DEFAULT_CONFIG.JWT_EXPIRES_IN),
    refreshExpiresIn: getEnvVar(
      'JWT_REFRESH_EXPIRES_IN',
      DEFAULT_CONFIG.JWT_REFRESH_EXPIRES_IN
    ),
  },
  bcrypt: {
    rounds: getEnvNumber('BCRYPT_ROUNDS', DEFAULT_CONFIG.BCRYPT_ROUNDS),
  },
  aes: {
    secretKey: getEnvVar('AES_SECRET_KEY'),
    ivLength: getEnvNumber('AES_IV_LENGTH', DEFAULT_CONFIG.AES_IV_LENGTH),
  },
};

export const securityConfig: ISecurityConfig = {
  maxConnectionsPerIp: getEnvNumber(
    'MAX_CONNECTIONS_PER_IP',
    DEFAULT_CONFIG.MAX_CONNECTIONS_PER_IP
  ),
  rateLimit: {
    windowMs: getEnvNumber(
      'RATE_LIMIT_WINDOW_MS',
      DEFAULT_CONFIG.RATE_LIMIT_WINDOW_MS
    ),
    maxRequests: getEnvNumber(
      'RATE_LIMIT_MAX_REQUESTS',
      DEFAULT_CONFIG.RATE_LIMIT_MAX_REQUESTS
    ),
  },
};

export const loggerConfig: ILoggerConfig = {
  level: getEnvVar('LOG_LEVEL', DEFAULT_CONFIG.LOG_LEVEL),
  filePath: process.env.LOG_FILE_PATH,
  maxSize: process.env.LOG_MAX_SIZE,
  maxFiles: process.env.LOG_MAX_FILES
    ? parseInt(process.env.LOG_MAX_FILES, 10)
    : undefined,
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};