# @webhook-proxy/core

Webhook Proxy 核心服务 - 部署在 Cloudflare Workers 上的 webhook 代理服务。

## 功能特性

- ✅ **多平台支持**：支持 9 种平台的 webhook
  - GitHub, GitLab, QQBot, Telegram, Stripe, Jenkins, Jira, Sentry, Generic
- ✅ **实时推送**：WebSocket 和 SSE 支持
- ✅ **用户认证**：GitHub/GitLab OAuth 登录
- ✅ **双因素认证**：TOTP + WebAuthn/Passkey
- ✅ **签名验证**：支持各平台的 webhook 签名验证
- ✅ **事件转换**：统一的事件格式

## 快速开始

### 1. 安装依赖

```bash
# 从项目根目录
pnpm install

# 或在 core 目录
cd packages/core
pnpm install
```

### 2. 配置环境变量

复制 `.dev.vars.example` 到 `.dev.vars` 并配置：

```bash
cp ../../.dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Session & JWT
SESSION_SECRET=your_session_secret_at_least_32_characters
JWT_SECRET=your_jwt_secret_at_least_32_characters

# Email (可选)
RESEND_API_KEY=your_resend_api_key
```

### 3. 初始化数据库

```bash
# 创建本地数据库
pnpm db:migrate:local
```

### 4. 启动开发服务器

```bash
pnpm dev
```

服务将运行在 `http://localhost:8787`

## 开发

### 目录结构

```
packages/core/
├── src/
│   ├── adapters/      # 平台适配器
│   ├── api/          # API 路由
│   ├── auth/         # 认证相关
│   ├── components/   # React 组件
│   ├── db/           # 数据库操作
│   ├── durable-objects/  # Durable Objects
│   ├── middleware/   # 中间件
│   ├── pages/        # 页面
│   ├── routes/       # 路由
│   ├── types/        # 类型定义
│   ├── utils/        # 工具函数
│   └── index.ts      # 入口文件
├── migrations/       # 数据库迁移
├── public/          # 静态资源
├── scripts/         # 脚本
├── package.json
├── tsconfig.json
└── wrangler.toml    # Cloudflare Workers 配置
```

### 可用命令

```bash
# 开发
pnpm dev              # 启动开发服务器

# 构建
pnpm type-check       # 类型检查

# 数据库
pnpm db:create        # 创建数据库
pnpm db:migrate:local # 本地数据库迁移
pnpm db:migrate       # 远程数据库迁移

# 部署
pnpm deploy           # 部署到 Cloudflare Workers

# 清理
pnpm clean            # 清理构建产物
```

## API 端点

### 认证

- `GET /auth/github` - GitHub OAuth 登录
- `GET /auth/gitlab` - GitLab OAuth 登录
- `GET /auth/github/callback` - GitHub OAuth 回调
- `GET /auth/gitlab/callback` - GitLab OAuth 回调
- `GET /auth/logout` - 登出

### API

- `GET /api/me` - 获取当前用户信息
- `GET /api/proxies` - 列出所有 proxies
- `POST /api/proxies` - 创建 proxy
- `PUT /api/proxies/:id` - 更新 proxy
- `DELETE /api/proxies/:id` - 删除 proxy

### Webhook

- `POST /:platform/:randomKey` - 接收 webhook
- `GET /:platform/:randomKey/ws` - WebSocket 连接
- `GET /:platform/:randomKey/sse` - SSE 连接

## 部署

### 配置 Cloudflare

1. 登录 Cloudflare Dashboard
2. 创建 Workers 应用
3. 创建 D1 数据库
4. 创建 KV 命名空间

### 配置 wrangler.toml

编辑 `wrangler.toml`：

```toml
name = "webhook-proxy"
main = "src/index.ts"
compatibility_date = "2023-12-01"

[[d1_databases]]
binding = "DB"
database_name = "webhook-proxy-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"

[[durable_objects.bindings]]
name = "WEBHOOK_CONNECTIONS"
class_name = "WebhookConnection"
script_name = "webhook-proxy"
```

### 配置环境变量

```bash
# 在 Cloudflare Dashboard 中配置环境变量
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GITLAB_CLIENT_ID
wrangler secret put GITLAB_CLIENT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put JWT_SECRET
wrangler secret put RESEND_API_KEY
```

### 部署

```bash
pnpm deploy
```

## 平台适配器

### 支持的平台

每个平台都有独立的适配器：

- **GitHub** (`adapters/github-cf.ts`)
- **GitLab** (`adapters/gitlab-cf.ts`)
- **QQBot** (`adapters/qqbot-cf.ts`)
- **Telegram** (`adapters/telegram-cf.ts`)
- **Stripe** (`adapters/stripe-cf.ts`)
- **Jenkins** (`adapters/jenkins-cf.ts`)
- **Jira** (`adapters/jira-cf.ts`)
- **Sentry** (`adapters/sentry-cf.ts`)
- **Generic** (`adapters/generic-cf.ts`)

### 添加新平台

1. 在 `src/adapters/` 创建新的适配器文件
2. 实现 `BaseAdapter` 接口
3. 在 `src/routes/webhook.ts` 添加路由处理
4. 更新类型定义

## 数据库

### 表结构

- `users` - 用户表
- `oauth_bindings` - OAuth 绑定
- `passkeys` - Passkey/WebAuthn 凭证
- `proxies` - Webhook proxies

### 迁移

```bash
# 创建新迁移
# (手动在 migrations/ 目录创建 SQL 文件)

# 应用迁移（本地）
pnpm db:migrate:local

# 应用迁移（远程）
pnpm db:migrate
```

## 相关文档

- [部署指南](../../DEPLOYMENT.md)
- [性能优化](../../PERFORMANCE.md)
- [QQ Bot 指南](../../QQBOT_GUIDE.md)
- [Email 设置](../../EMAIL_SETUP.md)
- [贡献指南](../../CONTRIBUTING.md)

## 许可证

MIT

## 相关项目

- [@webhook-proxy/cli](../cli) - 命令行工具

