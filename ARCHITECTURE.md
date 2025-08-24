# OrionGameServer Framework 架构设计文档

## 项目概述
**OrionGameServer** (猎户座游戏服务器) 是一个基于 Node.js + TypeScript 的分布式休闲游戏服务器框架，遵循代码简洁之道，提供高性能、高安全性、高可扩展性的游戏服务解决方案。

## 核心设计原则

### 代码简洁之道 (Clean Code Principles)
- **避免回调地狱**: 全面使用 `async/await`
- **单一职责**: 每个类/模块只负责一项功能
- **开闭原则**: 对扩展开放，对修改关闭
- **命名清晰**: 函数、变量名自解释，减少注释需求
- **小函数**: 函数保持简短，一个函数只做一件事
- **DRY原则**: 避免重复代码，提取公共逻辑
- **依赖注入**: 降低耦合，便于测试和扩展

## 技术栈

| 类别 | 技术/库 | 用途 |
|------|---------|------|
| 运行时环境 | Node.js (v20.x+) | 高性能异步I/O |
| 开发语言 | TypeScript | 静态类型，提升代码质量 |
| 数据库 | MongoDB + Mongoose | 数据持久化存储 |
| 缓存 | Redis + ioredis | 缓存热点数据，会话管理 |
| 通信协议 | WebSocket/WSS | 实时双向通信 |
| 数据格式 | JSON | 轻量数据交换 |
| 加密 | AES + TLS | 内容加密 + 传输加密 |
| 日志 | Winston/Pino | 结构化日志记录 |
| 负载均衡 | Nginx + PM2 | 流量分发，进程管理 |
| 代码规范 | ESLint + Prettier | 代码风格一致性 |

## 分布式架构设计

### 微服务架构
采用微服务架构，各服务独立部署、扩展和维护：

#### 1. 网关服务器 (Gateway Server)
**职责:**
- 客户端连接唯一入口
- WebSocket连接管理
- 协议解析与加密解密
- 消息路由到后端服务
- 客户端消息广播

**技术实现:**
- WSS连接处理
- Redis Pub/Sub消息分发
- 连接管理器维护session映射
- 防DDOS连接频率限制

#### 2. 登录服务器 (Login Server)
**职责:**
- 用户注册、登录处理
- JWT Token生成与验证
- 游客登录与账户绑定
- 用户信息验证

**技术实现:**
- HTTP/HTTPS接口
- JWT Token管理
- 设备ID生成 (UUID)
- 第三方账号集成接口

#### 3. 逻辑服务器 (Logic Server)
**职责:**
- 游戏核心逻辑处理
- 社交功能 (聊天系统)
- 业务模块 (匹配、战斗、任务)
- 数据库交互

**技术实现:**
- RPC/消息队列通信
- 高度模块化设计
- Redis Pub/Sub消息发布
- 负载均衡动态分配

#### 4. 数据库服务器 (Database Server)
**职责:**
- 统一数据访问接口
- 数据持久化存储
- 定期数据备份
- 数据一致性保障

**技术实现:**
- MongoDB集群
- Mongoose ODM
- mongodump定时备份
- Schema类型检查

## 安全机制

### 防外挂
- 关键逻辑服务端计算
- 异常行为检测与分析
- 通信数据AES加密
- 客户端仅负责表现层

### 防DDOS
- Nginx/云服务流量清洗
- IP黑白名单机制
- 单IP连接数限制
- 请求频率控制

### 防注入攻击
- 严格数据格式校验
- class-validator参数验证
- 禁用eval等危险函数
- MongoDB防NoSQL注入

### 通信加密
- **双重加密**: HTTPS/WSS + AES内容加密
- **密钥交换**: 登录后HTTPS安全交换AES密钥
- **加密流程**: JSON → AES加密 → Base64编码 → WSS传输

## 核心功能实现

### 登录与重连
1. **登录流程**:
   - 客户端HTTPS请求登录服务器
   - 验证成功生成JWT Token
   - Session信息存入Redis
   - 客户端携带Token连接网关

2. **断线重连**:
   - Token有效期内可重连任意网关
   - 验证Redis中Session存在性
   - 通知逻辑服务器更新玩家状态

### 负载均衡
- **网关层**: Nginx轮询/最少连接策略
- **逻辑层**: 根据服务器负载动态分配
- **负载信息**: 定期上报到Redis

### 消息系统
- **全局聊天**: Redis Pub/Sub全局广播
- **私聊**: 定向发送到目标用户网关
- **消息路由**: 网关订阅频道自动分发

## 目录结构

```
orion-game-server/
├── docs/                     # 项目文档
│   ├── ARCHITECTURE.md       # 架构设计文档
│   └── API.md               # API接口文档
├── src/
│   ├── services/             # 微服务目录
│   │   ├── gateway/          # 网关服务器
│   │   │   ├── index.ts
│   │   │   ├── connection-manager.ts
│   │   │   └── message-router.ts
│   │   ├── login/            # 登录服务器
│   │   │   ├── index.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── token.service.ts
│   │   └── logic/            # 逻辑服务器
│   │       ├── index.ts
│   │       ├── modules/      # 游戏功能模块
│   │       │   ├── chat/
│   │       │   ├── match/
│   │       │   └── battle/
│   │       └── event-handlers/
│   ├── common/               # 公共代码
│   │   ├── config/           # 配置管理
│   │   ├── database/         # 数据库连接
│   │   ├── dtos/             # 数据传输对象
│   │   ├── interfaces/       # TypeScript接口
│   │   ├── logger/           # 日志系统
│   │   └── utils/            # 工具函数
│   └── index.ts              # 项目入口
├── tests/                    # 测试文件
├── .env                      # 环境变量
├── .eslintrc.js             # ESLint配置
├── .prettierrc              # Prettier配置
├── package.json
└── tsconfig.json
```

## 开发规范

### 命名约定
- 类名: PascalCase (UserService)
- 函数/变量: camelCase (getUserInfo)
- 常量: UPPER_SNAKE_CASE (MAX_CONNECTIONS)
- 文件名: kebab-case (user-service.ts)

### 代码组织
- 每个文件单一职责
- 导出接口优于导出类
- 使用barrel exports (index.ts)
- 依赖注入替代直接依赖

### 错误处理
- 统一错误码定义
- 结构化错误响应
- 完善的日志记录
- 优雅的错误恢复

### 测试策略
- 单元测试覆盖核心逻辑
- 集成测试验证服务交互
- 性能测试确保负载能力
- 安全测试防范攻击风险

## 部署与运维

### 容器化部署
- Docker容器化各微服务
- docker-compose本地开发
- Kubernetes生产环境编排
- 配置文件外部化管理

### 监控与告警
- 系统性能指标监控
- 业务数据统计分析
- 异常情况自动告警
- 日志集中管理分析

### 扩展策略
- 水平扩展微服务实例
- 数据库读写分离
- CDN加速静态资源
- 缓存策略优化

---

**核心理念**: 代码应该像散文一样易读，业务逻辑清晰表达，技术细节封装隐藏。通过良好的架构设计和代码规范，构建一个现代化、高可用、安全且易于维护的分布式游戏服务器框架。