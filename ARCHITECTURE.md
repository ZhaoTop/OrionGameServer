# OrionGameServer Framework v2.0 架构设计文档

## 项目概述
**OrionGameServer v2.0** (猎户座游戏服务器) 是一个基于 NestJS + Vue 3 的现代化分布式游戏服务器管理系统，遵循代码简洁之道，提供高性能、高安全性、高可扩展性的游戏服务解决方案。本版本完全重构架构，采用企业级框架和最佳实践。

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

| 类别 | 技术/库 | 版本 | 用途 |
|------|---------|------|------|
| 运行时环境 | Node.js | >= 20.x | 高性能异步I/O |
| 开发语言 | TypeScript | >= 5.0 | 静态类型，提升代码质量 |
| **后端框架** | **NestJS** | **>= 10.x** | **企业级Node.js框架，装饰器驱动** |
| API文档 | @nestjs/swagger | >= 7.0 | 自动生成Swagger文档，零配置 |
| **前端框架** | **Vue 3** | **>= 3.3** | **组合式API，现代化响应式框架** |
| UI组件库 | Element Plus | >= 2.3 | Vue3企业级组件库，开箱即用 |
| 数据库 | MongoDB + Mongoose | >= 6.0 | 数据持久化存储 |
| 状态管理 | Pinia | >= 2.1 | Vue状态管理，替代Vuex |
| 路由 | Vue Router | >= 4.2 | 前端路由管理 |
| 构建工具 | Vite | >= 4.0 | 极速构建工具 |
| HTTP客户端 | Axios | >= 1.4 | API接口调用 |
| 认证 | JWT + bcrypt | - | 令牌认证+密码加密 |
| 验证 | class-validator | >= 0.14 | 请求参数验证 |
| 代码规范 | ESLint + Prettier | - | 代码风格一致性 |

## 架构设计 v2.0

### 整体架构
基于NestJS模块化架构 + Vue 3管理后台的一体化解决方案：

#### 1. 核心后端服务 (NestJS Backend)
**职责:**
- 统一API接口服务
- 用户认证与授权管理
- 游戏数据统计与分析
- 管理后台API支持
- 自动API文档生成

**技术实现:**
- NestJS模块化架构
- @nestjs/swagger自动文档
- JWT双Token认证机制
- MongoDB数据持久化
- 全局异常过滤器

#### 2. 认证模块 (Auth Module)
**职责:**
- 游客登录与设备管理
- 用户注册与登录
- JWT Token生成与刷新
- 密码安全加密

**技术实现:**
- @Public()装饰器控制公开API
- bcrypt密码哈希
- UUID设备ID生成
- 双Token机制(AccessToken + RefreshToken)

#### 3. 管理模块 (Admin Module)
**职责:**
- 用户信息管理
- 游戏数据统计
- 用户留存分析
- 系统监控数据

**技术实现:**
- JWT守卫保护管理API
- MongoDB聚合查询
- 留存率计算算法
- 分页查询优化

#### 4. 管理后台 (Vue 3 Dashboard)
**职责:**
- 可视化数据展示
- 用户管理界面
- 数据分析图表
- 系统状态监控

**技术实现:**
- Vue 3组合式API
- Element Plus组件库
- Pinia状态管理
- Axios API封装
- TypeScript类型安全

#### 5. 数据层 (Data Layer)
**职责:**
- 用户数据模型
- 游戏统计数据
- Schema验证
- 数据关系管理

**技术实现:**
- Mongoose ODM
- MongoDB文档数据库
- Schema类型验证
- 索引优化查询

## 安全机制 v2.0

### JWT认证安全
- **双Token机制**: AccessToken + RefreshToken
- **安全守卫**: JWT全局守卫保护API
- **公开API**: @Public()装饰器控制
- **Token过期**: 自动刷新机制

### 数据验证安全
- **参数验证**: class-validator全局验证
- **类型安全**: TypeScript类型棆查
- **DTO验证**: 请求数据传输对象验证
- **Schema校验**: Mongoose Schema数据类型校验

### 密码加密安全
- **bcrypt哈希**: 密码加密存储
- **盐值加密**: 防彩虹表攻击
- **密码复杂度**: 可配置密码策略
- **敏感数据**: 不记录敏感信息日志

### CORS与跨域安全
- **CORS配置**: 跨域请求安全控制
- **域名白名单**: 仅允许指定域名访问
- **请求方法**: 限制允许的HTTP方法
- **请求头**: 控制允许的请求头

## 核心功能实现 v2.0

### 认证流程
1. **游客登录**:
   - 设备ID(UUID)自动生成
   - 创建游客账户
   - 生成JWT AccessToken + RefreshToken
   - 返回用户信息和Token

2. **用户注册/登录**:
   - bcrypt密码加密验证
   - 创建正式用户账户
   - JWT Token生成与管理
   - 用户信息持久化存储

3. **Token管理**:
   - AccessToken(短期有效)
   - RefreshToken(长期有效)
   - 自动Token刷新机制
   - Token黑名单管理

### 管理后台功能
1. **数据统计**:
   - 实时用户数据统计
   - 游戏数据分析
   - 用户留存率计算
   - 数据可视化展示

2. **用户管理**:
   - 用户列表分页查询
   - 用户详情信息展示
   - 用户状态管理(启用/禁用)
   - 用户删除功能

3. **系统监控**:
   - 健康检查接口
   - 服务状态监控
   - API响应时间统计
   - 错误日志记录

## 项目结构 v2.0

```
orion-game-server-v2/
├── 📝 README.md                 # 项目介绍文档
├── 🏠 ARCHITECTURE.md           # v2.0架构设计文档
│
├── 🖥️ server/                    # NestJS后端服务
│   ├── src/
│   │   ├── 📚 modules/           # 功能模块
│   │   │   ├── 🔐 auth/          # 认证模块 (游客/用户登录)
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.module.ts
│   │   │   │   └── dto/
│   │   │   ├── 👥 admin/         # 管理后台模块 (用户管理/数据统计)
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.service.ts
│   │   │   │   ├── admin.module.ts
│   │   │   │   └── dto/
│   │   │   └── 👤 user/          # 用户数据模块 (MongoDB Schema)
│   │   │       ├── user.service.ts
│   │   │       ├── user.module.ts
│   │   │       └── schemas/
│   │   ├── 🛠️ common/            # 公共组件
│   │   │   ├── ⚙️ config/        # 配置管理 (数据库/JWT)
│   │   │   ├── 🛡️ guards/        # 路由守卫 (JWT认证)
│   │   │   ├── 🏷️ decorators/    # 自定义装饰器 (@Public)
│   │   │   ├── 📦 dtos/          # 数据传输对象
│   │   │   └── 🔧 utils/         # 工具函数
│   │   ├── 🏰 app.module.ts      # 根模块
│   │   └── 🚀 main.ts            # 应用入口 (Swagger配置)
│   ├── .env                   # 环境变量配置
│   ├── package.json           # 后端依赖配置
│   └── nest-cli.json          # NestJS CLI配置
│
├── 📱 admin-dashboard/           # Vue 3 管理后台
│   ├── src/
│   │   ├── 📄 views/             # 页面组件
│   │   │   ├── 📊 Dashboard/     # 仪表板 (数据概览)
│   │   │   ├── 👥 User/          # 用户管理 (列表/详情)
│   │   │   └── 📈 Analytics/     # 数据分析 (留存率)
│   │   ├── 🛣️ router/            # Vue Router路由配置
│   │   ├── 📦 store/             # Pinia状态管理 (认证状态)
│   │   ├── 🔌 api/               # API接口封装 (Axios)
│   │   ├── 📝 types/             # TypeScript类型定义
│   │   ├── App.vue
│   │   └── main.ts
│   ├── ⚡ vite.config.ts        # Vite构建配置
│   └── package.json           # 前端依赖配置
│
└── 📁 docs/                     # 项目文档 (可选)
    ├── API.md                 # API接口文档
    └── DEPLOYMENT.md          # 部署指南
```
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

## 版本升级说明

### v2.0 主要改进
- **框架升级**: 从自定义Express架架升级为NestJS
- **文档自动化**: 使用@nestjs/swagger替代手动注释
- **管理后台**: 新增Vue 3 + Element Plus管理界面
- **代码简化**: 减少90%的注释代码，提升可读性
- **类型安全**: 全面TypeScript支持，编译时错误检测

### 迁移优势
- **开发效率**: 装饰器驱动开发，减少样板代码
- **企业级**: NestJS企业级框架，成熟的生态系统
- **自动文档**: Swagger文档与代码同步，零维护成本
- **现代化UI**: Vue 3 + Element Plus企业级组件
- **类型安全**: TypeScript全覆盖，编译时错误检测

---

**v2.0 核心理念**: 采用企业级框架和最佳实践，在保持代码简洁易读的同时，提供强大的功能支持和类型安全保障。通过NestJS模块化架构和Vue 3现代化前端，构建一个高性能、高可用、易于维护的游戏服务器管理系统。