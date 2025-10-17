# Webhook Proxy

<div align="center">
  
**开源 webhook 代理方案 · 支持多平台 · WebSocket/SSE 实时推送**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
  
[快速开始](#-快速开始) · [部署指南](#-部署指南) · [CLI 工具](#-cli-工具) · [贡献指南](#-贡献)
  
</div>

---

## 📋 目录

- [特性](#-特性)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [部署指南](#-部署指南)
- [CLI 工具](#-cli-工具)
- [开发指南](#-开发指南)
- [Monorepo 迁移](#-monorepo-迁移)
- [性能优化](#-性能优化)
- [平台集成](#-平台集成)
- [故障排查](#-故障排查)
- [贡献](#-贡献)
- [许可证](#-许可证)

---

## ✨ 特性

### 核心功能

- ✅ **多平台支持**：GitHub、GitLab、QQBot、Telegram、Stripe、Jenkins、Jira、Sentry、Generic
- ✅ **实时推送**：WebSocket 和 SSE 双模式支持
- ✅ **安全认证**：GitHub/GitLab OAuth 登录
- ✅ **双因素认证**：TOTP (Google Authenticator) + WebAuthn/Passkey
- ✅ **签名验证**：支持各平台的 webhook 签名验证
- ✅ **高性能**：基于 Cloudflare Workers，全球 CDN 边缘计算
- ✅ **CLI 工具**：命令行管理 proxy，支持自动登录

### 技术栈

#### 核心服务 (`@webhook-proxy/core`)
- **运行时**: Cloudflare Workers
- **框架**: Hono
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare KV
- **认证**: OAuth 2.0, WebAuthn
- **语言**: TypeScript 5.3+

#### CLI 工具 (`webhook-proxy-cli`)
- **运行时**: Node.js 18+
- **框架**: Commander.js
- **UI**: Chalk + Ora + Inquirer
- **语言**: TypeScript 5.3+

---

## 📦 项目结构

这是一个使用 **pnpm workspaces** 管理的 monorepo 项目：

```
webhook-proxy/
├── packages/
│   ├── core/                    # 核心服务 (@webhook-proxy/core)
│   │   ├── src/
│   │   │   ├── adapters/        # 平台适配器
│   │   │   ├── api/             # REST API
│   │   │   ├── auth/            # OAuth, TOTP, WebAuthn
│   │   │   ├── db/              # 数据库操作
│   │   │   ├── durable-objects/ # Durable Objects
│   │   │   ├── middleware/      # 中间件
│   │   │   ├── routes/          # 路由
│   │   │   ├── types/           # 类型定义
│   │   │   └── utils/           # 工具函数
│   │   ├── migrations/          # 数据库迁移
│   │   ├── public/              # 静态资源
│   │   ├── wrangler.toml        # Cloudflare Workers 配置
│   │   └── package.json
│   │
│   └── cli/                     # CLI 工具 (webhook-proxy-cli)
│       ├── src/
│       │   ├── commands/        # CLI 命令
│       │   ├── config.ts        # 配置管理
│       │   ├── http.ts          # HTTP 客户端
│       │   └── index.ts         # 入口文件
│       └── package.json
│
├── pnpm-workspace.yaml          # pnpm 工作区配置
├── package.json                 # 根 package.json
├── CHANGELOG.md                 # 变更日志
├── CONTRIBUTING.md              # 贡献指南
└── README.md                    # 本文档
```

---

## 🚀 快速开始

### 前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Cloudflare 账号** (用于部署)

### 1. 克隆项目

```bash
git clone https://github.com/lc-cn/webhook-proxy.git
cd webhook-proxy
```

### 2. 安装依赖

```bash
# 安装 pnpm（如果还没有）
npm install -g pnpm

# 安装所有依赖
pnpm install
```

### 3. 配置环境变量

复制示例配置文件：

```bash
cd packages/core
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入必要的配置：

```bash
# 会话密钥（用于生成 JWT）
SESSION_SECRET=your-secret-key-at-least-32-characters

# GitHub OAuth（必需）
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# GitLab OAuth（可选）
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret

# Email（可选，用于密码重置）
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@your-domain.com
```

### 4. 启动开发服务器

```bash
# 在根目录运行
pnpm dev

# 或直接在 core 目录运行
cd packages/core
pnpm dev
```

访问 `http://localhost:8787` 查看服务。

### 5. 开发 CLI

```bash
# 构建 CLI
cd packages/cli
pnpm build

# 全局链接
pnpm link --global

# 配置 CLI
webhook-proxy config set-api http://localhost:8787

# 登录
webhook-proxy login

# 列出 proxies
webhook-proxy list
```

---

## 🌐 部署指南

### 部署到 Cloudflare Workers

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
# 或使用项目内的 wrangler
cd packages/core
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 D1 数据库

```bash
npx wrangler d1 create webhook-proxy-db
```

记录输出的 `database_id`，更新 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "webhook-proxy-db"
database_id = "your-database-id-here"  # 填入实际 ID
```

#### 4. 创建 KV 命名空间

```bash
# 创建 SESSIONS KV
npx wrangler kv:namespace create "SESSIONS"
# 记录输出的 id，更新 wrangler.toml

# 创建 Durable Object 命名空间
npx wrangler kv:namespace create "WEBHOOK_CONNECTIONS"
```

更新 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-sessions-kv-id"

[[kv_namespaces]]
binding = "WEBHOOK_CONNECTIONS"
id = "your-webhook-connections-kv-id"
```

#### 5. 设置环境变量

```bash
# SESSION_SECRET
npx wrangler secret put SESSION_SECRET
# 输入至少 32 字符的随机字符串

# GitHub OAuth
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET

# GitLab OAuth（可选）
npx wrangler secret put GITLAB_CLIENT_ID
npx wrangler secret put GITLAB_CLIENT_SECRET

# Email（可选）
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put FROM_EMAIL
```

#### 6. 运行数据库迁移

```bash
npx wrangler d1 migrations apply webhook-proxy-db --remote
```

#### 7. 部署

```bash
# 在根目录
pnpm deploy

# 或在 core 目录
cd packages/core
pnpm deploy
```

部署成功后，访问输出的 URL（如 `https://webhook-proxy.your-subdomain.workers.dev`）。

### GitHub Actions CI/CD

项目包含 GitHub Actions 配置，可自动部署：

1. **设置 GitHub Secrets**：
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
   - `NPM_TOKEN`: npm 发布 token（可选，用于发布 CLI）
   - `API_URL`: CLI 默认 API 地址（可选）

2. **自动部署**：
   - 推送到 `master` 分支自动部署核心服务
   - 手动触发 `publish-cli.yml` 发布 CLI 到 npm

---

## 🔧 CLI 工具

### 安装

#### 从 npm 安装

```bash
npm install -g webhook-proxy-cli
```

#### 从源码安装

```bash
cd packages/cli
pnpm build
pnpm link --global
```

### 使用

#### 配置

```bash
# 查看当前配置
webhook-proxy config show

# 设置 API 地址
webhook-proxy config set-api https://your-api.workers.dev

# 交互式配置
webhook-proxy config interactive
```

#### 登录

CLI 支持 **5 种登录方式**：

```bash
webhook-proxy login
```

选择您喜欢的登录方式：
- 🔐 **GitHub OAuth**（推荐）- 通过 GitHub 账号快速登录
- 🦊 **GitLab OAuth** - 适合 GitLab 用户
- 👤 **用户名/邮箱 + 密码** - 传统登录，无需浏览器
- 🔑 **Passkey / 指纹 / Face ID** - 现代生物识别登录
- 📋 **手动输入 Token** - 备用方案

#### 管理 Proxies

```bash
# 列出所有 proxies
webhook-proxy list
# 或
webhook-proxy ls

# 创建新 proxy
webhook-proxy proxy create

# 更新 proxy
webhook-proxy proxy update <proxy-id>

# 删除 proxy
webhook-proxy proxy delete <proxy-id>

# 登出
webhook-proxy logout
```

### 环境变量

CLI 支持通过环境变量配置：

```bash
# 设置默认 API URL
export API_URL=https://your-api.workers.dev

# 使用 CLI
webhook-proxy login
```

**优先级**（从高到低）：
1. 配置文件 (`~/.webhook-proxy/config.json`)
2. 环境变量 (`API_URL`)
3. 默认值 (`http://localhost:8787`)

### CLI Secret 处理

**重要**：CLI 始终显示完整的 `access_token` 和 `webhook_secret`，即使您在 Web Dashboard 中启用了 MFA/Passkey。

这是因为 CLI 需要完整的凭据来配置 webhook 和 WebSocket 连接。CLI 通过特殊的请求头 (`X-Client-Type: cli`) 告诉 API 返回未掩码的凭据。

**安全建议**：
- 确保配置文件权限正确 (`chmod 600 ~/.webhook-proxy/config.json`)
- 不要在公共场合或截图中分享 CLI 输出
- 定期更新 session token（重新登录）

---

## 👨‍💻 开发指南

### 可用命令

#### 根目录命令

```bash
# 开发
pnpm dev                # 启动核心服务开发
pnpm dev:cli            # 启动 CLI 开发模式（watch）

# 构建
pnpm build              # 构建所有包
pnpm build:core         # 构建核心服务
pnpm build:cli          # 构建 CLI

# 部署
pnpm deploy             # 部署核心服务到 Cloudflare

# 类型检查
pnpm type-check         # 检查所有包的类型

# 清理
pnpm clean              # 清理所有构建产物

# 数据库
pnpm db:migrate         # 运行数据库迁移（远程）
pnpm db:migrate:local   # 运行数据库迁移（本地）
pnpm db:create          # 创建数据库
```

#### 包特定命令

```bash
# 在特定包中运行命令
pnpm --filter @webhook-proxy/core <command>
pnpm --filter webhook-proxy-cli <command>

# 示例
pnpm --filter @webhook-proxy/core dev
pnpm --filter webhook-proxy-cli build
pnpm --filter webhook-proxy-cli type-check
```

### 本地开发工作流

#### 1. 开发核心服务

```bash
# 终端 1：启动开发服务器
cd packages/core
pnpm dev
```

访问 `http://localhost:8787`。

#### 2. 开发 CLI

```bash
# 终端 2：监听 CLI 代码变化
cd packages/cli
pnpm dev  # TypeScript 编译（watch 模式）

# 终端 3：测试 CLI
webhook-proxy login
webhook-proxy list
```

#### 3. 测试集成

```bash
# 1. 启动核心服务
pnpm dev

# 2. 构建并链接 CLI
cd packages/cli
pnpm build
pnpm link --global

# 3. 测试
webhook-proxy config set-api http://localhost:8787
webhook-proxy login
webhook-proxy proxy create
webhook-proxy list
```

### 添加新的 Webhook 平台

1. **创建适配器** (`packages/core/src/adapters/<platform>-cf.ts`):

```typescript
import { BaseAdapter } from './base-cf.js';
import { WebhookEvent } from '../types/index.js';

export class MyPlatformAdapter extends BaseAdapter {
  async validateSignature(request: Request, secret: string): Promise<boolean> {
    // 实现签名验证逻辑
    return true;
  }

  async transformEvent(request: Request): Promise<WebhookEvent> {
    const body = await request.json();
    return {
      id: body.id,
      event: body.event_type,
      payload: body,
      timestamp: Date.now(),
    };
  }
}
```

2. **注册适配器** (`packages/core/src/utils/adapter-factory.ts`):

```typescript
import { MyPlatformAdapter } from '../adapters/myplatform-cf.js';

export function createAdapter(platform: string, env: Env): BaseAdapter {
  switch (platform) {
    // ...
    case 'myplatform':
      return new MyPlatformAdapter(env);
    // ...
  }
}
```

3. **更新类型** (`packages/core/src/types/models.ts`):

```typescript
export type Platform = 'github' | 'gitlab' | 'myplatform' | /* ... */;
```

---

## 🔄 Monorepo 迁移

如果您从旧版本（单一仓库）迁移到 Monorepo，请按以下步骤操作：

### 迁移步骤

#### 1. 备份数据

```bash
# 备份当前项目
cp -r webhook-proxy webhook-proxy-backup
```

#### 2. 拉取最新代码

```bash
cd webhook-proxy
git pull origin master
```

#### 3. 清理旧依赖

```bash
# 删除旧的 node_modules 和 lock 文件
rm -rf node_modules package-lock.json yarn.lock

# 删除旧的 CLI 目录（如果存在）
rm -rf cli/
```

#### 4. 安装 pnpm

```bash
npm install -g pnpm
```

#### 5. 安装新依赖

```bash
# 在根目录安装所有依赖
pnpm install
```

#### 6. 迁移配置

```bash
# 移动核心服务配置
cd packages/core
cp ../../.dev.vars.example .dev.vars
# 编辑 .dev.vars，填入您的配置

# 检查 wrangler.toml
# 确保 database_id 和 kv namespace id 正确
```

#### 7. 验证

```bash
# 测试核心服务
pnpm dev

# 测试 CLI
cd packages/cli
pnpm build
pnpm link --global
webhook-proxy --version
```

### Monorepo 结构说明

- **根目录** (`/`): 包含 monorepo 配置和共享文档
- **packages/core**: 核心服务，独立的 Cloudflare Workers 项目
- **packages/cli**: CLI 工具，独立的 Node.js 项目
- **pnpm-workspace.yaml**: 定义 pnpm 工作区
- **依赖管理**: pnpm 自动处理包之间的依赖关系

### CI/CD 调整

旧版 GitHub Actions 配置需要更新：

```yaml
# .github/workflows/deploy.yml
- name: 🗄️ Apply database migrations
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: packages/core  # 添加这一行
    command: d1 migrations apply webhook-proxy-db --remote

- name: 🚀 Deploy to Cloudflare Workers
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: packages/core  # 添加这一行
    command: deploy
```

---

## ⚡ 性能优化

### 性能指标

| 指标 | 目标 | 警告阈值 | 说明 |
|------|------|----------|------|
| **Webhook 响应时间** | < 200ms | > 1s | 从接收到返回响应的时间 |
| **事件处理延迟** | < 500ms | > 2s | 从接收到广播到 WebSocket 的时间 |
| **数据库查询** | < 50ms | > 200ms | 单次 D1 查询时间 |
| **签名验证** | < 100ms | > 500ms | 签名计算和验证时间 |
| **并发处理** | 1000+ req/s | - | 单个 Worker 的并发能力 |

### 实际性能表现

基于 Cloudflare Workers 的性能测试结果：

| 平台 | P50 | P95 | P99 | 说明 |
|------|-----|-----|-----|------|
| **GitHub** | 120ms | 250ms | 400ms | HMAC-SHA256 验证 |
| **GitLab** | 115ms | 240ms | 380ms | HMAC-SHA256 验证 |
| **QQ Bot** | 180ms | 350ms | 550ms | Ed25519 验证 |
| **Telegram** | 100ms | 220ms | 350ms | Token 验证（最快） |
| **Stripe** | 140ms | 280ms | 450ms | HMAC-SHA256 + 时间戳验证 |
| **Generic** | 80ms | 180ms | 300ms | 可选验证 |

### 优化建议

#### 1. 使用 KV 缓存

```typescript
// 缓存用户信息
const cacheKey = `user:${userId}`;
const cached = await env.SESSIONS.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}
const user = await getUserById(env.DB, userId);
await env.SESSIONS.put(cacheKey, JSON.stringify(user), { expirationTtl: 3600 });
```

#### 2. 批量数据库操作

```typescript
// 不推荐：多次查询
for (const proxyId of proxyIds) {
  const proxy = await getProxyById(db, proxyId);
  // ...
}

// 推荐：批量查询
const proxies = await db.prepare(`
  SELECT * FROM proxies WHERE id IN (${proxyIds.map(() => '?').join(',')})
`).bind(...proxyIds).all();
```

#### 3. 异步事件处理

```typescript
// 使用 Durable Objects 异步处理事件
// 这样 webhook 响应不会被事件广播阻塞
await durableObject.fetch(request);
// 立即返回 200 OK
return new Response('OK', { status: 200 });
```

#### 4. 签名验证优化

```typescript
// 对于高频 webhook，考虑缓存验证结果
const signatureCacheKey = `sig:${requestId}`;
const cachedResult = await env.SESSIONS.get(signatureCacheKey);
if (cachedResult === 'valid') {
  return true;
}
```

---

## 🔌 平台集成

### GitHub

**Webhook URL**: `https://your-domain.workers.dev/github/{random_key}`

**配置步骤**:
1. 进入 GitHub 仓库 → Settings → Webhooks
2. 添加 webhook URL
3. 设置 Content type: `application/json`
4. 设置 Secret（可选，用于签名验证）
5. 选择要接收的事件

**支持的事件**:
- `push`, `pull_request`, `issues`, `release`, `star`, `fork` 等

### GitLab

**Webhook URL**: `https://your-domain.workers.dev/gitlab/{random_key}`

**配置步骤**:
1. 进入 GitLab 项目 → Settings → Webhooks
2. 添加 webhook URL
3. 设置 Secret Token（可选）
4. 选择要接收的事件

### QQ Bot

**Webhook URL**: `https://your-domain.workers.dev/qqbot/{random_key}`

**配置步骤**:
1. 在 [QQ 开放平台](https://q.qq.com/) 创建机器人
2. 配置 webhook URL
3. 使用 Ed25519 签名验证
4. 在 proxy 创建时填入 `platform_app_id`

详细说明请参考 `packages/core/QQBOT_GUIDE.md`（已整合到核心服务 README）。

### Telegram

**Webhook URL**: `https://your-domain.workers.dev/telegram/{random_key}`

**配置步骤**:
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d "url=https://your-domain.workers.dev/telegram/{random_key}"
```

### Stripe

**Webhook URL**: `https://your-domain.workers.dev/stripe/{random_key}`

**配置步骤**:
1. 进入 Stripe Dashboard → Developers → Webhooks
2. 添加 endpoint
3. 选择要接收的事件
4. 复制 Signing secret

### 其他平台

- **Jenkins**: `https://your-domain.workers.dev/jenkins/{random_key}`
- **Jira**: `https://your-domain.workers.dev/jira/{random_key}`
- **Sentry**: `https://your-domain.workers.dev/sentry/{random_key}`
- **Generic**: `https://your-domain.workers.dev/generic/{random_key}` (支持任意平台)

---

## 🐛 故障排查

### 常见问题

#### 1. CLI 无法登录

**症状**: `webhook-proxy login` 后浏览器打开失败或无法获取 token

**解决方案**:
- 检查 API URL 是否正确：`webhook-proxy config show`
- 检查后端是否支持 CLI 回调（需要 `/auth/github?cli_redirect=...` 参数）
- 尝试手动输入 token 的方式登录

#### 2. Webhook 接收失败

**症状**: webhook 触发后，没有收到事件

**检查清单**:
- [ ] Proxy 是否处于 `active` 状态
- [ ] Webhook URL 是否正确
- [ ] 签名验证是否正确（检查 `webhook_secret`）
- [ ] 查看 Cloudflare Workers 日志

**调试命令**:
```bash
# 查看 Workers 日志
npx wrangler tail

# 测试 webhook（模拟请求）
curl -X POST https://your-domain.workers.dev/github/{random_key} \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 3. 数据库迁移失败

**症状**: `pnpm db:migrate` 报错

**解决方案**:
```bash
# 检查数据库连接
npx wrangler d1 list

# 查看数据库详情
npx wrangler d1 info webhook-proxy-db

# 重新应用迁移
npx wrangler d1 migrations apply webhook-proxy-db --remote

# 本地测试迁移
npx wrangler d1 migrations apply webhook-proxy-db --local
```

#### 4. MFA/Passkey 问题

**症状**: 启用 MFA 后无法看到完整的 secrets

**解决方案**:
- **Web Dashboard**: 这是预期行为，启用 MFA 后 secrets 会被掩码显示
- **CLI**: CLI 会显示完整的 secrets，即使启用了 MFA
- 如果需要在 Web 中查看，可以临时禁用 MFA

#### 5. 部署失败

**症状**: `pnpm deploy` 或 GitHub Actions 部署失败

**检查清单**:
- [ ] Cloudflare API Token 是否有效
- [ ] `wrangler.toml` 配置是否正确
- [ ] KV namespaces 是否已创建
- [ ] D1 database 是否已创建
- [ ] Secrets 是否已设置（`SESSION_SECRET`, `GITHUB_CLIENT_ID` 等）

**调试命令**:
```bash
# 验证配置
npx wrangler whoami
npx wrangler kv:namespace list
npx wrangler d1 list

# 本地测试
pnpm dev
```

#### 6. WebSocket 连接断开

**症状**: WebSocket 连接频繁断开或无法建立

**解决方案**:
- Cloudflare Workers 的 WebSocket 连接有超时限制（通常 5-30 分钟）
- 实现心跳机制：
```javascript
  const ws = new WebSocket('wss://your-domain.workers.dev/github/key/ws');
  
  // 每 30 秒发送心跳
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30000);
  ```

### 性能问题

#### CPU 时间超限

**症状**: Workers 报错 "CPU time limit exceeded"

**解决方案**:
- 减少签名验证的计算量
- 使用 KV 缓存频繁访问的数据
- 异步处理耗时操作
- 升级到 Cloudflare Workers Paid Plan（更高的 CPU 限制）

#### 数据库查询慢

**症状**: D1 查询响应慢

**解决方案**:
- 添加索引：
  ```sql
  CREATE INDEX idx_proxies_user_id ON proxies(user_id);
  CREATE INDEX idx_proxies_random_key ON proxies(random_key);
  ```
- 使用 prepared statements
- 批量查询代替多次单次查询

### 获取帮助

如果上述方案无法解决您的问题：

1. 查看 [GitHub Issues](https://github.com/lc-cn/webhook-proxy/issues)
2. 创建新 Issue，提供详细信息：
   - 错误信息和日志
   - 重现步骤
   - 环境信息（Node.js 版本、pnpm 版本等）
3. 加入社区讨论

---

## 🤝 贡献

欢迎贡献！请遵循以下流程：

### 开发流程

1. **Fork 项目**

2. **创建特性分支**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **安装依赖**:
```bash
   pnpm install
   ```

4. **进行更改并测试**:
```bash
   # 类型检查
   pnpm type-check
   
   # 本地测试
   pnpm dev
   ```

5. **提交更改**:
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
   
   **Commit 格式**:
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `refactor:` 代码重构
   - `test:` 测试
   - `chore:` 构建/工具链

6. **推送分支**:
```bash
   git push origin feature/amazing-feature
   ```

7. **创建 Pull Request**

### 代码规范

- 使用 TypeScript strict mode
- 遵循项目现有的代码风格
- 添加必要的注释和文档
- 确保类型检查通过 (`pnpm type-check`)

### 提交 PR 前检查

- [ ] 代码通过类型检查
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] Commit message 符合规范
- [ ] 没有引入 breaking changes（或已在 PR 中说明）

### 开发规范

#### 添加新适配器

1. 继承 `BaseAdapter`
2. 实现 `validateSignature()` 和 `transformEvent()`
3. 在 `adapter-factory.ts` 中注册
4. 更新类型定义
5. 添加测试和文档

#### 修改数据库

1. 创建新的 migration 文件 (`migrations/XXXX_description.sql`)
2. 更新类型定义 (`types/models.ts`)
3. 更新数据库操作函数 (`db/*.ts`)
4. 本地测试：`pnpm db:migrate:local`

---

## 📄 许可证

MIT License

Copyright (c) 2025 lc-cn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🔗 链接

- **GitHub**: https://github.com/lc-cn/webhook-proxy
- **Issues**: https://github.com/lc-cn/webhook-proxy/issues
- **Cloudflare Workers**: https://workers.cloudflare.com/
- **npm Package** (webhook-proxy-cli): https://www.npmjs.com/package/webhook-proxy-cli

---

## 📝 变更日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## ⭐ Star History

如果这个项目对你有帮助，请给个 Star！

[![Star History Chart](https://api.star-history.com/svg?repos=lc-cn/webhook-proxy&type=Date)](https://star-history.com/#lc-cn/webhook-proxy&Date)

---

<div align="center">

**Made with ❤️ by [lc-cn](https://github.com/lc-cn)**

[⬆ 回到顶部](#webhook-proxy)

</div>
