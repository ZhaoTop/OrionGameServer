# OrionGameServer v2.0 部署指南

## 概述
本文档详细说明了 OrionGameServer v2.0 的部署和运行方式。系统采用 NestJS + Vue 3 架构，支持开发环境和生产环境部署。

## 环境要求

### 必需环境
- **Node.js**: >= 20.0.0
- **npm**: >= 8.0.0
- **MongoDB**: >= 6.0 (自动连接本地实例)

### 推荐环境
- **内存**: >= 4GB RAM
- **存储**: >= 10GB 可用空间
- **网络**: 稳定的网络连接

### 可选环境
- **Redis**: >= 7.0 (用于缓存和会话管理)
- **Nginx**: 用于生产环境反向代理
- **PM2**: 用于生产环境进程管理

---

## 快速部署

### 1. 环境准备
```bash
# 检查 Node.js 版本
node --version  # 应该 >= v20.0.0

# 检查 npm 版本
npm --version   # 应该 >= 8.0.0

# 检查 MongoDB 服务状态（确保已启动）
# Windows: 服务管理器中检查 MongoDB 服务
# macOS/Linux: 
sudo systemctl status mongod  # 或 brew services list | grep mongodb
```

### 2. 项目下载
```bash
# 克隆项目
git clone https://github.com/your-repo/orion-game-server.git
cd orion-game-server

# 或者从现有项目目录开始
cd D:\IAA\Mini-Game\code\108_wb\WarriorServer
```

### 3. 后端服务部署
```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 复制并配置环境变量（可选）
cp .env.example .env  # 如果有示例文件
# 或者手动创建 .env 文件
```

**环境变量配置** (`.env`):
```bash
# 数据库配置
DATABASE_URL=mongodb://localhost:27017/warrior-game

# JWT 配置
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# 服务配置
PORT=3000
NODE_ENV=development

# 可选配置
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### 4. 前端管理后台部署
```bash
# 新开终端窗口，进入前端目录
cd admin-dashboard

# 安装依赖
npm install
```

### 5. 启动服务

#### 开发模式 (推荐新手)
```bash
# 终端1: 启动后端服务
cd server
npm run start:dev

# 终端2: 启动前端服务
cd admin-dashboard
npm run dev
```

#### 生产模式
```bash
# 构建后端
cd server
npm run build
npm run start:prod

# 构建前端
cd admin-dashboard
npm run build
# 构建产物在 dist/ 目录，可部署到任何静态服务器
```

---

## 详细部署步骤

### 开发环境部署

#### 1. 后端服务（端口3000）
```bash
cd server

# 安装依赖
npm install

# 开发模式启动（支持热重载）
npm run start:dev

# 或者调试模式启动
npm run start:debug
```

**后端启动成功标志**:
```
[Nest] 12345  - 2025/08/24, 10:30:00   LOG [NestApplication] Nest application successfully started +2ms
[Nest] 12345  - 2025/08/24, 10:30:00   LOG [Bootstrap] 🚀 Server is running on: http://localhost:3000
[Nest] 12345  - 2025/08/24, 10:30:00   LOG [Bootstrap] 📚 API Documentation: http://localhost:3000/api/docs
```

#### 2. 前端服务（端口8080）
```bash
cd admin-dashboard

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 或者指定端口启动
npm run dev -- --port 8080
```

**前端启动成功标志**:
```
  VITE v4.4.9  ready in 500 ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 生产环境部署

#### 1. 单机部署
```bash
# 后端生产构建
cd server
npm run build
npm run start:prod

# 前端生产构建
cd admin-dashboard
npm run build

# 使用 serve 工具部署前端（或 Nginx）
npm install -g serve
serve -s dist -l 8080
```

#### 2. PM2 部署管理
```bash
# 安装 PM2
npm install -g pm2

# 启动后端服务
pm2 start server/dist/main.js --name "orion-server"

# 启动前端服务（如果需要 PM2 管理）
pm2 serve admin-dashboard/dist 8080 --name "orion-admin" --spa

# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart orion-server
```

#### 3. Nginx 反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /path/to/admin-dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 接口代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Swagger 文档
    location /api/docs {
        proxy_pass http://localhost:3000/api/docs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:3000/health;
    }
}
```

---

## Docker 容器化部署

### 1. Dockerfile 配置

**后端 Dockerfile** (`server/Dockerfile`):
```dockerfile
FROM node:20-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]
```

**前端 Dockerfile** (`admin-dashboard/Dockerfile`):
```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境镜像
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose 配置
```yaml
version: '3.8'

services:
  # MongoDB 数据库
  mongodb:
    image: mongo:6.0
    container_name: orion-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  # Redis 缓存（可选）
  redis:
    image: redis:7-alpine
    container_name: orion-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

  # 后端服务
  backend:
    build: ./server
    container_name: orion-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mongodb://admin:password@mongodb:27017/warrior-game?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-production-jwt-secret
      NODE_ENV: production
    depends_on:
      - mongodb
      - redis

  # 前端服务
  frontend:
    build: ./admin-dashboard
    container_name: orion-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### 3. 部署命令
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down

# 重建服务
docker-compose up -d --build
```

---

## 验证部署

### 1. 服务检查
```bash
# 检查后端服务
curl http://localhost:3000/health

# 预期响应
{
  "status": "ok",
  "timestamp": "2025-08-24T11:51:47.502Z",
  "uptime": 3600,
  "version": "2.0.0"
}
```

### 2. 功能测试
```bash
# 测试游客登录
curl -X POST http://localhost:3000/auth/guest-login \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device-123"}'

# 访问 Swagger 文档
open http://localhost:3000/api/docs

# 访问管理后台
open http://localhost:8080
```

### 3. 数据库检查
```bash
# 连接 MongoDB
mongosh
use warrior-game
db.users.countDocuments()  # 应该显示用户数量
```

---

## 监控和维护

### 1. 日志管理
```bash
# PM2 日志
pm2 logs orion-server

# Docker 日志
docker-compose logs -f backend

# 日志轮转配置（生产环境）
# 在 main.ts 中配置 Winston 日志轮转
```

### 2. 性能监控
```bash
# PM2 监控面板
pm2 monit

# 内存使用监控
pm2 show orion-server

# 数据库性能
db.runCommand({serverStatus: 1})
```

### 3. 备份策略
```bash
# 数据库备份
mongodump --uri="mongodb://localhost:27017/warrior-game" --out ./backup/

# 自动备份脚本（crontab）
0 2 * * * /usr/local/bin/mongodump --uri="mongodb://localhost:27017/warrior-game" --out /backup/$(date +\%Y-\%m-\%d)
```

---

## 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 查看端口占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# 终止进程
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                # macOS/Linux
```

#### 2. 数据库连接失败
```bash
# 检查 MongoDB 状态
mongo --eval 'db.runCommand("ismaster")'

# 重启 MongoDB 服务
# Windows: services.msc -> MongoDB
sudo systemctl restart mongod  # Linux
brew services restart mongodb  # macOS
```

#### 3. 依赖安装问题
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 4. 内存不足
```bash
# 增加 Node.js 内存限制
node --max-old-space-size=4096 dist/main.js

# PM2 配置内存限制
pm2 start dist/main.js --name orion-server --max-memory-restart 1G
```

### 性能优化

#### 1. 数据库索引
```javascript
// 在 MongoDB 中创建索引
db.users.createIndex({ "username": 1 })
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "deviceId": 1 })
db.users.createIndex({ "lastLoginAt": -1 })
```

#### 2. 缓存配置
```bash
# Redis 内存优化
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## 扩展部署

### 水平扩展
```yaml
# docker-compose.yml 多实例配置
services:
  backend:
    deploy:
      replicas: 3
    ports:
      - "3000-3002:3000"
```

### 负载均衡
```nginx
upstream backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

---

## 安全部署建议

### 1. 生产环境配置
```bash
# 使用强密码
JWT_SECRET=$(openssl rand -base64 64)

# 限制数据库访问
# MongoDB 启用认证
# Redis 设置密码
```

### 2. 防火墙配置
```bash
# 仅开放必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

### 3. SSL/TLS 证书
```bash
# Let's Encrypt 免费证书
certbot --nginx -d your-domain.com
```

---

*本部署指南涵盖了从开发到生产的完整部署流程，如遇问题请参考故障排除章节或提交 Issue。*