# 🚀 Webhook Proxy

开源 webhook 代理服务，基于 **Hono** 框架和 **Cloudflare Workers** 构建。将 webhook 事件实时转换为 WebSocket 或 SSE 事件流。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/lc-cn/webhook-proxy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/lc-cn/webhook-proxy?style=social)](https://github.com/lc-cn/webhook-proxy)
[![CI](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml)
[![Deploy](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml)

## ✨ 特性

- 🔌 **多平台支持**：GitHub、GitLab（可扩展）
- 🌐 **多协议支持**：WebSocket 和 SSE
- 👤 **完整用户系统**：
  - 密码 + 邮箱注册/登录
  - GitHub/GitLab OAuth 绑定
  - Passkey (WebAuthn) 无密码登录
  - MFA (TOTP) 双因素认证
- 📧 **邮件验证**：集成 Resend 邮件服务（3000 封/月免费额度）
- 🔒 **安全认证**：Webhook 签名验证、Access Token
- ⚡ **高性能**：Cloudflare 全球边缘网络
- 💾 **持久化存储**：D1 数据库 + KV 缓存
- 🎯 **开箱即用**：精美的 Web UI 界面

## 🏗️ 技术栈

- **[Hono](https://hono.dev/)**: 超快速 Web 框架（13KB）
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: 边缘计算平台
- **[Durable Objects](https://developers.cloudflare.com/durable-objects/)**: WebSocket 持久连接
- **[D1 Database](https://developers.cloudflare.com/d1/)**: SQLite 数据库
- **[KV Storage](https://developers.cloudflare.com/kv/)**: 键值存储
- **[Resend](https://resend.com)**: 现代邮件发送服务（3000 封/月免费）

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 10+ （⚠️ 推荐使用 pnpm 10，避免 lockfile 兼容性问题）
- Cloudflare 账号（免费）

> **💡 安装 pnpm 10**: `npm install -g pnpm@10`

### 1. 克隆项目

```bash
git clone https://github.com/lc-cn/webhook-proxy.git
cd webhook-proxy
pnpm install
```

### 2. 配置环境变量

复制 `.dev.vars.example` 为 `.dev.vars`：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```env
# OAuth 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-secret

# 密钥（随机生成）
SESSION_SECRET=your-random-session-secret-min-32-chars
JWT_SECRET=your-random-jwt-secret-min-32-chars

# 环境标识
ENVIRONMENT=development
```

### 3. 创建 OAuth 应用

#### GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建 "OAuth App"
3. **Homepage URL**: `http://localhost:8787`
4. **Authorization callback URL**: `http://localhost:8787/auth/github/callback`
5. 保存 `Client ID` 和 `Client Secret`

#### GitLab OAuth App

1. 访问 [GitLab Applications](https://gitlab.com/-/profile/applications)
2. 创建 "Application"
3. **Redirect URI**: `http://localhost:8787/auth/gitlab/callback`
4. **Scopes**: `read_user`
5. 勾选 **Confidential**
6. 保存 `Application ID` 和 `Secret`

### 4. 初始化数据库

```bash
# 创建 D1 数据库
pnpm run db:create

# 创建 KV 命名空间
npx wrangler kv:namespace create "SESSIONS"

# 更新 wrangler.toml 中的 database_id 和 kv_namespace id

# 运行本地迁移
pnpm run db:migrate:local
```

### 5. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:8787 🎉

## 🔄 CI/CD 自动部署

项目已配置 GitHub Actions 自动部署到 Cloudflare Workers。

### 配置步骤

1. **Fork 本仓库**

2. **配置 GitHub Secrets**

   在仓库的 Settings → Secrets and variables → Actions 中添加：

   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

   > 详细配置说明请查看 [CI/CD 配置指南](.github/CI_CD_SETUP.md)

3. **推送代码自动部署**

   ```bash
   git push origin master
   ```

   GitHub Actions 会自动：
   - ✅ 类型检查
   - ✅ 应用数据库迁移
   - ✅ 部署到 Cloudflare Workers

### 工作流

- **CI**: 每次 Push 和 PR 都会运行类型检查
- **Preview**: PR 创建时运行预览部署验证
- **Deploy**: 合并到 master 后自动部署到生产环境

## 📦 手动部署到生产环境

如果不使用 CI/CD，可以手动部署：

### 1. 准备生产环境

```bash
# 创建生产 D1 数据库
npx wrangler d1 create webhook-proxy-db

# 创建生产 KV 命名空间
npx wrangler kv:namespace create "SESSIONS"

# 更新 wrangler.toml
```

### 2. 设置 Secrets

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITLAB_CLIENT_ID
npx wrangler secret put GITLAB_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put JWT_SECRET
```

### 3. 运行生产迁移

```bash
npx wrangler d1 migrations apply webhook-proxy-db --remote
```

### 4. 部署

```bash
pnpm run deploy
```

### 5. 配置自定义域名

1. 在 Cloudflare Dashboard 中添加 Workers 路由
2. 绑定自定义域名（如 `hooks.yourdomain.com`）

### 6. 更新 OAuth 回调 URL

将 GitHub 和 GitLab OAuth 应用的回调 URL 更新为：
- `https://hooks.yourdomain.com/auth/github/callback`
- `https://hooks.yourdomain.com/auth/gitlab/callback`

### 7. 配置邮件发送（可选）

在 Cloudflare DNS 中添加以下记录（详见 [EMAIL_SETUP.md](EMAIL_SETUP.md)）：

```
类型: TXT
名称: @
内容: v=spf1 include:relay.mailchannels.net ~all
```

```
类型: TXT
名称: _mailchannels
内容: v=mc1 cfid=your-cloudflare-account-id
```

## 📖 使用说明

### 1. 用户注册/登录

访问首页，可以通过以下方式登录：
- **用户名/邮箱 + 密码**
- **GitHub OAuth**
- **GitLab OAuth**
- **Passkey（WebAuthn）**

### 2. 创建 Webhook Proxy

登录后，在 Dashboard 页面创建新的 Proxy：

```javascript
{
  "name": "My Project",
  "platform": "github",  // 或 "gitlab"
  "webhook_secret": "your-secret",  // 可选
  "verify_signature": true  // 是否验证签名
}
```

系统会生成：
- **Webhook URL**: 用于配置在 GitHub/GitLab
- **WebSocket URL**: 客户端连接地址
- **SSE URL**: 服务端推送地址
- **Access Token**: 客户端认证令牌

### 3. 配置 Webhook

#### GitHub Webhook

1. 进入仓库 **Settings → Webhooks → Add webhook**
2. **Payload URL**: 复制 Dashboard 中的 Webhook URL
3. **Content type**: `application/json`
4. **Secret**: 与创建 Proxy 时的 `webhook_secret` 相同
5. 选择需要的事件类型
6. 点击 **Add webhook**

#### GitLab Webhook

1. 进入项目 **Settings → Webhooks**
2. **URL**: 复制 Dashboard 中的 Webhook URL
3. **Secret token**: 与创建 Proxy 时的 `webhook_secret` 相同
4. 选择需要的触发器
5. 点击 **Add webhook**

### 4. 连接客户端

#### WebSocket 客户端（浏览器）

```javascript
const token = 'your-access-token';
const ws = new WebSocket(`wss://hooks.yourdomain.com/github/your-random-key/ws?token=${token}`);

ws.onopen = () => {
  console.log('✅ 已连接');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 收到事件:', data);
  
  // data.type - 事件类型（如 'push', 'pull_request'）
  // data.payload - 原始 webhook 数据
  // data.timestamp - 事件时间戳
};

ws.onerror = (error) => {
  console.error('❌ 错误:', error);
};

ws.onclose = () => {
  console.log('🔌 连接关闭');
};
```

#### SSE 客户端（浏览器）

```javascript
const token = 'your-access-token';
const eventSource = new EventSource(
  `https://hooks.yourdomain.com/github/your-random-key/sse?token=${token}`
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 收到事件:', data);
};

eventSource.onerror = (error) => {
  console.error('❌ 错误:', error);
  eventSource.close();
};
```

#### Node.js 客户端

```javascript
import WebSocket from 'ws';

const token = 'your-access-token';
const ws = new WebSocket(
  `wss://hooks.yourdomain.com/github/your-random-key/ws?token=${token}`
);

ws.on('open', () => {
  console.log('✅ 已连接');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('📨 收到事件:', event);
});
```

## 🔒 安全特性

### MFA (Multi-Factor Authentication)

在 **Settings** 页面启用 TOTP 双因素认证：

1. 扫描二维码或手动输入密钥到认证器应用（如 Google Authenticator）
2. 输入验证码完成设置
3. 启用后，查看 Proxy 的 Secret 需要验证

### Passkey (WebAuthn)

无密码登录，更安全更方便：

1. 在 **Settings** 页面注册 Passkey
2. 使用生物识别（指纹/Face ID）或硬件密钥
3. 下次登录时直接使用 Passkey

### 邮箱验证

1. 在 **Settings** 页面设置邮箱
2. 系统发送验证码到邮箱
3. 输入验证码完成验证

### Webhook 签名验证

- **GitHub**: HMAC-SHA256 签名（`X-Hub-Signature-256` header）
- **GitLab**: 简单 Token 验证（`X-Gitlab-Token` header）

## 📊 API 文档

### 认证相关

- `GET /` - 首页（登录/注册）
- `GET /auth/github` - GitHub OAuth 授权
- `GET /auth/gitlab` - GitLab OAuth 授权
- `GET /auth/logout` - 登出
- `POST /api/account/register` - 用户注册
- `POST /api/account/login` - 用户登录

### Proxy 管理

- `GET /api/proxies` - 列出所有 Proxies
- `POST /api/proxies` - 创建新 Proxy
- `PUT /api/proxies/:id` - 更新 Proxy
- `DELETE /api/proxies/:id` - 删除 Proxy

### 安全设置

- `GET /api/security/settings` - 获取安全设置
- `POST /api/security/mfa/setup` - 设置 MFA
- `POST /api/security/mfa/verify` - 验证 MFA
- `POST /api/security/passkey/register/options` - 注册 Passkey
- `POST /api/security/passkey/login/options` - Passkey 登录

### Webhook 接收

- `POST /:platform/:randomKey` - 接收 webhook 事件

### 实时连接

- `WS /:platform/:randomKey/ws?token=xxx` - WebSocket 连接
- `GET /:platform/:randomKey/sse?token=xxx` - SSE 连接

## 💰 成本分析

### Cloudflare Workers 免费额度

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| **Workers 请求** | 100,000/天 | 足够中小型应用 |
| **Durable Objects** | 1,000,000 请求/月 | WebSocket 连接管理 |
| **D1 数据库** | 5GB 存储 | 用户和 Proxy 数据 |
| **D1 读取** | 5,000,000 行/天 | 查询操作 |
| **KV 读取** | 100,000/天 | Session 管理 |
| **KV 写入** | 1,000/天 | 登录/登出 |

对于大多数个人和小型团队项目，**完全免费**！

### 升级到付费计划

如果超出免费额度，Workers Paid 计划仅需 **$5/月**：
- **10,000,000** 请求/月
- **30,000,000** Durable Objects 请求/月
- **超出部分**: $0.50/百万请求

## 🛠️ 本地开发

### 查看日志

```bash
# 实时日志
npx wrangler tail --format pretty

# 特定环境
npx wrangler tail --env production
```

### 数据库操作

```bash
# 查看表结构
npx wrangler d1 execute webhook-proxy-db --local --command ".schema"

# 执行 SQL
npx wrangler d1 execute webhook-proxy-db --local --command "SELECT * FROM users;"

# 创建新迁移
echo "ALTER TABLE users ADD COLUMN new_field TEXT;" > migrations/000X_description.sql
```

### 重置本地数据库

```bash
rm .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
pnpm run db:migrate:local
```

## 📁 项目结构

```
webhook-proxy/
├── src/
│   ├── routes/                 # 路由模块
│   │   ├── auth.ts            # OAuth 认证
│   │   ├── account.ts         # 账户管理（注册/登录）
│   │   ├── account-settings.ts # 账户设置
│   │   ├── security.ts        # 安全设置（MFA/Passkey）
│   │   ├── api.ts             # Proxy 管理 API
│   │   ├── webhook.ts         # Webhook 处理
│   │   └── dashboard.ts       # Dashboard 路由
│   ├── pages/                  # Hono JSX 页面
│   │   ├── Home.tsx           # 首页
│   │   ├── Dashboard.tsx      # 控制面板
│   │   ├── Settings.tsx       # 设置页面
│   │   ├── About.tsx          # 关于页面
│   │   └── Docs.tsx           # 文档页面
│   ├── middleware/             # 中间件
│   │   ├── auth.ts            # 认证中间件
│   │   └── logger.ts          # 日志中间件
│   ├── adapters/               # 平台适配器
│   │   ├── github-cf.ts       # GitHub 适配器
│   │   └── gitlab-cf.ts       # GitLab 适配器
│   ├── auth/                   # OAuth 提供者
│   │   └── oauth.ts
│   ├── db/                     # 数据库操作
│   │   ├── users.ts
│   │   ├── proxies.ts
│   │   ├── oauth-bindings.ts
│   │   └── passkeys.ts
│   ├── durable-objects/        # Durable Objects
│   │   └── webhook-connection.ts
│   ├── utils/                  # 工具函数
│   │   ├── email.ts           # 邮件发送
│   │   ├── password.ts        # 密码哈希
│   │   └── mask.ts            # 密钥掩码
│   ├── types/                  # 类型定义
│   │   ├── index.ts
│   │   └── models.ts
│   ├── components/             # UI 组件
│   │   └── Layout.tsx
│   └── index.ts                # 主入口
├── migrations/                 # D1 数据库迁移
├── scripts/                    # 脚本工具
├── wrangler.toml              # Cloudflare Workers 配置
└── package.json
```

## 🎨 UI 截图

> 待添加截图

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关资源

### 文档

- [邮件配置指南](EMAIL_SETUP.md) - Resend 邮件发送配置

### 框架和平台

- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Durable Objects 文档](https://developers.cloudflare.com/durable-objects/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)

### Webhook 文档

- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [GitLab Webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)

## 💡 使用场景

- 📱 **实时通知系统** - 将 GitHub/GitLab 事件推送到移动应用
- 🔔 **CI/CD 监控** - 实时监控构建和部署状态
- 📊 **事件聚合** - 汇总多个仓库的 webhook 事件
- 🔄 **跨平台同步** - 同步 GitHub 和 GitLab 事件
- 📝 **审计日志** - 记录和分析所有 webhook 事件
- 🎯 **自动化触发** - 基于事件触发自定义工作流

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lc-cn/webhook-proxy&type=Date)](https://star-history.com/#lc-cn/webhook-proxy&Date)

---

<div align="center">
  <sub>Built with ❤️ using Hono and Cloudflare Workers</sub>
  <br>
  <sub>Designed for modern webhook proxy scenarios</sub>
</div>
