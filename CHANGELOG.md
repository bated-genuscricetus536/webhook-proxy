# Changelog

所有重要的项目变更都会记录在这个文件中。

## [2.0.0] - 2025-01-XX

### 🎉 重大变更

- **迁移到 Hono 框架**: 整个项目重构为基于 Hono 框架，支持多平台部署
- **模块化路由系统**: 将路由拆分为独立模块（auth, api, webhook）
- **中间件架构**: 引入标准化的中间件系统

### ✨ 新功能

- 添加认证中间件 (`src/middleware/auth.ts`)
- 添加日志中间件 (`src/middleware/logger.ts`)
- 支持多平台部署（Cloudflare Workers, Deno, Bun, Node.js, Vercel）
- 改进的错误处理和 404 处理
- 模块化的路由结构

### 📦 依赖更新

- 添加 `hono` ^3.12.0

### 📁 项目结构变更

```
新增:
- src/routes/auth.ts
- src/routes/api.ts
- src/routes/webhook.ts
- src/middleware/auth.ts
- src/middleware/logger.ts
- HONO_MIGRATION.md

删除:
- src/api/auth.ts
- src/api/proxies.ts
```

### 🔄 重构

- 重构主入口 `src/index.ts` 使用 Hono 应用
- 重构所有 API 处理器使用 Hono Context
- 改进类型定义和类型安全

### 📝 文档更新

- 更新 README.md 说明 Hono 架构
- 添加 HONO_MIGRATION.md 迁移指南
- 更新部署文档支持多平台

### ⚠️ 破坏性变更

无 - 所有 API 端点保持向后兼容

### 🐛 Bug 修复

无

---

## [1.0.0] - 2025-01-XX

### 🎉 初始版本

- OAuth 认证系统（GitHub/GitLab）
- 用户管理和 Proxy 管理
- WebSocket 和 SSE 实时事件推送
- Durable Objects 连接管理
- D1 数据库存储
- GitHub 和 GitLab 适配器
- 完整的 TypeScript 支持

