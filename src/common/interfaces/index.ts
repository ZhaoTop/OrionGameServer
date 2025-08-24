export interface IUser {
  id: string;
  username?: string;
  password?: string;
  email?: string;
  deviceId?: string;
  isGuest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameSession {
  userId: string;
  token: string;
  gatewayId?: string;
  isOnline: boolean;
  lastActivity: Date;
  expiresAt: Date;
}

export interface IMessage {
  id: string;
  type: MessageType;
  payload: unknown;
  timestamp: Date;
}

export interface IWebSocketMessage extends IMessage {
  encrypted?: boolean;
}

export interface IChatMessage {
  id: string;
  fromUserId: string;
  toUserId?: string;
  content: string;
  type: ChatType;
  timestamp: Date;
}

export enum MessageType {
  AUTH = 'auth',
  CHAT = 'chat',
  GAME_ACTION = 'game_action',
  SYSTEM = 'system',
  HEARTBEAT = 'heartbeat',
}

export enum ChatType {
  GLOBAL = 'global',
  PRIVATE = 'private',
  SYSTEM = 'system',
}

export interface IServerConfig {
  port: number;
  host?: string | undefined;
  ssl?: {
    cert: string;
    key: string;
  };
}

export interface IDatabaseConfig {
  mongodb: {
    uri: string;
    options?: Record<string, unknown>;
  };
  redis: {
    host: string;
    port: number;
    password?: string | undefined;
    db: number;
  };
}

export interface IAuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  bcrypt: {
    rounds: number;
  };
  aes: {
    secretKey: string;
    ivLength: number;
  };
}

export interface ISecurityConfig {
  maxConnectionsPerIp: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface ILoggerConfig {
  level: string;
  filePath?: string | undefined;
  maxSize?: string | undefined;
  maxFiles?: number | undefined;
}