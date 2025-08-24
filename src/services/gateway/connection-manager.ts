import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { createServiceLogger } from '@/common/logger';
import { RedisConnection } from '@/common/database';
import { securityConfig } from '@/common/config';
import { StringUtils } from '@/common/utils';

const logger = createServiceLogger('ConnectionManager');

interface ClientConnection {
  id: string;
  ws: WebSocket;
  userId?: string;
  ip: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class ConnectionManager {
  private connections = new Map<string, ClientConnection>();
  private ipConnections = new Map<string, Set<string>>();
  private redis: RedisConnection;

  constructor() {
    this.redis = RedisConnection.getInstance();
    this.startHeartbeatCheck();
  }

  public async addConnection(ws: WebSocket, req: IncomingMessage): Promise<string> {
    const clientId = uuidv4();
    const clientIp = this.getClientIp(req);

    if (!this.canAcceptConnection(clientIp)) {
      throw new Error('Connection limit exceeded for this IP');
    }

    const connection: ClientConnection = {
      id: clientId,
      ws,
      ip: clientIp,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(clientId, connection);
    this.addIpConnection(clientIp, clientId);

    logger.info(`New connection added: ${clientId} from ${clientIp}`);
    return clientId;
  }

  public async removeConnection(clientId: string): Promise<void> {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    try {
      if (connection.userId) {
        await this.updateUserStatus(connection.userId, false);
      }

      this.removeIpConnection(connection.ip, clientId);
      this.connections.delete(clientId);

      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close();
      }

      logger.info(`Connection removed: ${clientId}`);
    } catch (error) {
      logger.error(`Error removing connection ${clientId}:`, error);
    }
  }

  public getConnection(clientId: string): ClientConnection | undefined {
    return this.connections.get(clientId);
  }

  public async authenticateConnection(clientId: string, userId: string): Promise<void> {
    const connection = this.connections.get(clientId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    connection.userId = userId;
    connection.lastActivity = new Date();

    await this.updateUserStatus(userId, true, clientId);
    logger.info(`Connection authenticated: ${clientId} for user ${userId}`);
  }

  public updateActivity(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  public sendToClient(clientId: string, message: string): boolean {
    const connection = this.connections.get(clientId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.ws.send(message);
      this.updateActivity(clientId);
      return true;
    } catch (error) {
      logger.error(`Error sending message to client ${clientId}:`, error);
      return false;
    }
  }

  public async sendToUser(userId: string, message: string): Promise<boolean> {
    try {
      const userConnectionData = await this.redis.get(`user:${userId}:connection`);
      if (!userConnectionData) return false;

      const { gatewayId, connectionId } = JSON.parse(userConnectionData);
      
      // If it's this gateway, send directly
      if (gatewayId === process.env.GATEWAY_ID) {
        return this.sendToClient(connectionId, message);
      }

      // Otherwise, publish to the target gateway
      await this.redis.publish(`gateway:${gatewayId}:message`, 
        JSON.stringify({ connectionId, message }));
      
      return true;
    } catch (error) {
      logger.error(`Error sending message to user ${userId}:`, error);
      return false;
    }
  }

  public broadcastToAll(message: string): void {
    let sentCount = 0;
    for (const connection of this.connections.values()) {
      if (this.sendToClient(connection.id, message)) {
        sentCount++;
      }
    }
    logger.info(`Broadcast message sent to ${sentCount} clients`);
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getConnectionsByIp(ip: string): number {
    return this.ipConnections.get(ip)?.size || 0;
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private canAcceptConnection(ip: string): boolean {
    const currentConnections = this.getConnectionsByIp(ip);
    return currentConnections < securityConfig.maxConnectionsPerIp;
  }

  private addIpConnection(ip: string, clientId: string): void {
    if (!this.ipConnections.has(ip)) {
      this.ipConnections.set(ip, new Set());
    }
    this.ipConnections.get(ip)!.add(clientId);
  }

  private removeIpConnection(ip: string, clientId: string): void {
    const connections = this.ipConnections.get(ip);
    if (connections) {
      connections.delete(clientId);
      if (connections.size === 0) {
        this.ipConnections.delete(ip);
      }
    }
  }

  private async updateUserStatus(
    userId: string, 
    isOnline: boolean, 
    connectionId?: string
  ): Promise<void> {
    try {
      if (isOnline && connectionId) {
        const connectionData = {
          gatewayId: process.env.GATEWAY_ID || StringUtils.generateId(),
          connectionId,
          timestamp: new Date().toISOString(),
        };
        await this.redis.set(
          `user:${userId}:connection`, 
          JSON.stringify(connectionData),
          3600 // 1 hour TTL
        );
      } else {
        await this.redis.del(`user:${userId}:connection`);
      }
    } catch (error) {
      logger.error(`Error updating user status for ${userId}:`, error);
    }
  }

  private startHeartbeatCheck(): void {
    setInterval(() => {
      const now = new Date();
      const timeoutMs = 30000; // 30 seconds

      for (const [clientId, connection] of this.connections.entries()) {
        if (now.getTime() - connection.lastActivity.getTime() > timeoutMs) {
          logger.warn(`Client ${clientId} timed out, removing connection`);
          void this.removeConnection(clientId);
        }
      }
    }, 15000); // Check every 15 seconds
  }
}