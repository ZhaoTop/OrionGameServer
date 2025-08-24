# OrionGameServer v2.0 API 接口文档

## 概述
本文档详细描述了基于 NestJS 的 OrionGameServer v2.0 所有 API 接口。系统采用 RESTful API 设计，使用 JWT 认证，自动生成 Swagger 文档。

## 基础信息
- **服务地址**: http://localhost:3000
- **API 版本**: v2.0
- **Swagger 文档**: http://localhost:3000/api/docs
- **健康检查**: http://localhost:3000/health

## 认证机制
- **认证方式**: JWT Bearer Token
- **Token 类型**: Access Token + Refresh Token
- **Token 位置**: HTTP Header `Authorization: Bearer <token>`
- **过期时间**: Access Token(1小时), Refresh Token(7天)

---

## 🔐 认证接口 (`/auth`)

所有认证接口都是公开的，无需 JWT Token。

### 1. 游客登录
创建或登录游客账户，使用设备ID进行身份识别。

```http
POST /auth/guest-login
Content-Type: application/json

{
  "deviceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "ea3d289e-bf76-426d-aecf-cfd2b69add90",
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "isGuest": true,
      "isActive": true,
      "level": 1,
      "experience": 0,
      "coins": 0,
      "gems": 0,
      "lastLoginAt": "2025-08-24T10:30:00.000Z",
      "createdAt": "2025-08-24T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**状态码**:
- `200` - 登录成功
- `400` - 设备ID格式错误

### 2. 用户注册
创建新的正式用户账户。

```http
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass123",
  "email": "test@example.com"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b3ff1aae-fa0c-41cf-9db7-d62a69d118a9",
      "username": "testuser",
      "email": "test@example.com",
      "isGuest": false,
      "isActive": true,
      "level": 1,
      "experience": 0,
      "coins": 100,
      "gems": 0,
      "createdAt": "2025-08-24T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**状态码**:
- `201` - 注册成功
- `400` - 注册信息格式错误
- `409` - 用户名或邮箱已存在

### 3. 用户登录
使用用户名/邮箱和密码登录。

```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b3ff1aae-fa0c-41cf-9db7-d62a69d118a9",
      "username": "testuser",
      "email": "test@example.com",
      "isGuest": false,
      "isActive": true,
      "level": 5,
      "experience": 2400,
      "coins": 1250,
      "gems": 50,
      "lastLoginAt": "2025-08-24T11:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**状态码**:
- `200` - 登录成功
- `400` - 用户名或密码不能为空
- `401` - 用户名或密码错误

### 4. 刷新令牌
使用 Refresh Token 获取新的 Access Token。

```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**状态码**:
- `200` - 令牌刷新成功
- `401` - 无效的刷新令牌

### 5. 用户登出
客户端登出处理。

```http
POST /auth/logout
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

**状态码**:
- `200` - 登出成功

---

## 👥 管理后台接口 (`/admin`)

所有管理接口都需要有效的 JWT Token 认证。

### 1. 获取用户列表
分页获取用户列表，支持搜索和过滤。

```http
GET /admin/users?page=1&limit=10&search=test&userType=registered
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**查询参数**:
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页数量，默认为 10
- `search` (可选): 搜索关键词（用户名或邮箱）
- `userType` (可选): 用户类型 (`guest` | `registered`)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "b3ff1aae-fa0c-41cf-9db7-d62a69d118a9",
        "username": "testuser",
        "email": "test@example.com",
        "isGuest": false,
        "isActive": true,
        "level": 5,
        "experience": 2400,
        "coins": 1250,
        "gems": 50,
        "gamesPlayed": 15,
        "gamesWon": 8,
        "totalPlayTime": 180,
        "consecutiveLoginDays": 3,
        "lastLoginAt": "2025-08-24T11:00:00.000Z",
        "createdAt": "2025-08-24T09:00:00.000Z",
        "updatedAt": "2025-08-24T11:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

**状态码**:
- `200` - 查询成功
- `401` - 未认证或 Token 无效
- `400` - 查询参数错误

### 2. 获取用户详情
获取指定用户的详细信息。

```http
GET /admin/users/{userId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "b3ff1aae-fa0c-41cf-9db7-d62a69d118a9",
      "username": "testuser",
      "email": "test@example.com",
      "isGuest": false,
      "isActive": true,
      "level": 5,
      "experience": 2400,
      "coins": 1250,
      "gems": 50,
      "gamesPlayed": 15,
      "gamesWon": 8,
      "totalPlayTime": 180,
      "consecutiveLoginDays": 3,
      "deviceId": null,
      "lastLoginAt": "2025-08-24T11:00:00.000Z",
      "createdAt": "2025-08-24T09:00:00.000Z",
      "updatedAt": "2025-08-24T11:00:00.000Z"
    }
  }
}
```

**状态码**:
- `200` - 查询成功
- `401` - 未认证或 Token 无效
- `404` - 用户不存在

### 3. 更新用户状态
启用或禁用用户账户。

```http
PATCH /admin/users/{userId}/status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "isActive": false
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户状态更新成功"
}
```

**状态码**:
- `200` - 更新成功
- `401` - 未认证或 Token 无效
- `404` - 用户不存在
- `400` - 请求参数错误

### 4. 删除用户
永久删除指定用户。

```http
DELETE /admin/users/{userId}
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

**状态码**:
- `200` - 删除成功
- `401` - 未认证或 Token 无效
- `404` - 用户不存在

### 5. 获取游戏统计
获取游戏相关的整体统计数据。

```http
GET /admin/stats/game
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 89,
    "guestUsers": 45,
    "registeredUsers": 105,
    "todayNewUsers": 12,
    "totalGames": 2340,
    "avgGameDuration": 12.5,
    "timestamp": "2025-08-24T11:30:00.000Z"
  }
}
```

**状态码**:
- `200` - 查询成功
- `401` - 未认证或 Token 无效

### 6. 获取留存统计
获取用户留存率统计数据。

```http
GET /admin/stats/retention
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "day1Retention": 0.75,
    "day3Retention": 0.45,
    "day7Retention": 0.32,
    "day30Retention": 0.18,
    "totalNewUsers": 100,
    "timestamp": "2025-08-24T11:30:00.000Z"
  }
}
```

**状态码**:
- `200` - 查询成功
- `401` - 未认证或 Token 无效

---

## 🏥 系统监控接口

### 1. 健康检查
检查系统运行状态。

```http
GET /health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-08-24T11:51:47.502Z",
  "uptime": 3600,
  "version": "2.0.0",
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "free": "89.8 MB"
  }
}
```

**状态码**:
- `200` - 系统正常
- `503` - 系统异常

---

## 错误处理

### 错误响应格式
所有错误响应都遵循统一的格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "username",
        "message": "用户名不能为空"
      }
    ]
  },
  "timestamp": "2025-08-24T11:30:00.000Z"
}
```

### 常见错误码
- `VALIDATION_ERROR` - 参数验证错误
- `AUTHENTICATION_ERROR` - 认证失败
- `AUTHORIZATION_ERROR` - 权限不足
- `NOT_FOUND` - 资源不存在
- `CONFLICT` - 资源冲突（如用户名已存在）
- `INTERNAL_ERROR` - 服务器内部错误

---

## 请求限制和规范

### 请求限制
- **频率限制**: 每分钟最多 100 次请求
- **请求大小**: 最大 1MB
- **并发连接**: 每 IP 最多 10 个并发连接

### 请求规范
- **Content-Type**: 必须为 `application/json`
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (例: `2025-08-24T11:30:00.000Z`)
- **数值格式**: 浮点数保留2位小数

### 分页参数
- `page`: 页码，从 1 开始
- `limit`: 每页数量，范围 1-100，默认 10
- `total`: 总记录数
- `pages`: 总页数

---

## SDK 和代码示例

### JavaScript/TypeScript 示例
```typescript
// 游客登录
const guestLogin = async (deviceId: string) => {
  const response = await fetch('http://localhost:3000/auth/guest-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });
  return await response.json();
};

// 获取用户列表
const getUsers = async (token: string, page = 1, limit = 10) => {
  const response = await fetch(`http://localhost:3000/admin/users?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return await response.json();
};
```

### cURL 示例
```bash
# 游客登录
curl -X POST http://localhost:3000/auth/guest-login \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "550e8400-e29b-41d4-a716-446655440000"}'

# 获取用户列表
curl -X GET "http://localhost:3000/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 版本更新日志

### v2.0.0 (2025-08-24)
- 🔥 **重大更新**: 完全重构架构，采用 NestJS 框架
- ✨ **新增功能**: 自动 Swagger 文档生成
- ✨ **新增功能**: Vue 3 管理后台支持
- 🚀 **性能优化**: JWT 双 Token 认证机制
- 📝 **文档优化**: 完整 API 接口文档
- 🐛 **问题修复**: 修复各种类型安全问题

### v1.x.x (历史版本)
- 基于自定义 Express 框架
- 手动维护 API 文档
- 单一 Token 认证机制

---

*本文档与代码同步更新，如发现问题请提交 Issue 或查看在线 Swagger 文档。*