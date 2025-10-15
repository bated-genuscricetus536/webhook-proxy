# 部署指南

本文档详细说明如何将 Webhook Proxy 部署到 Cloudflare Workers。

## 前置要求

1. **Cloudflare 账号**
   - 注册 [Cloudflare](https://dash.cloudflare.com/sign-up)
   - 免费套餐即可开始使用

2. **Node.js**
   - 版本 18.0.0 或更高

3. **Wrangler CLI**
   - 已在项目依赖中包含

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

这会打开浏览器进行授权。

### 3. 创建 D1 数据库

```bash
npm run db:create
```

记下输出的 `database_id`，并更新 `wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "webhook-proxy-db"
database_id = "your-database-id-here"  # 填入实际的 database_id
```

### 4. 运行数据库迁移

```bash
npm run db:migrate
```

### 5. 创建 KV 命名空间

```bash
# 创建 SESSIONS KV
npx wrangler kv:namespace create "SESSIONS"
```

记下输出的 `id`，并更新 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-id-here"  # 填入实际的 id
```

如果需要预览环境：

```bash
npx wrangler kv:namespace create "SESSIONS" --preview
```

### 6. 配置 OAuth 应用

#### GitHub OAuth App

1. 访问 https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息：
   - Application name: `Webhook Proxy`
   - Homepage URL: `https://your-worker-name.workers.dev`
   - Authorization callback URL: `https://your-worker-name.workers.dev/auth/github/callback`
4. 点击 "Register application"
5. 记下 `Client ID` 和生成 `Client Secret`

#### GitLab OAuth App

1. 访问 https://gitlab.com/-/profile/applications
2. 填写信息：
   - Name: `Webhook Proxy`
   - Redirect URI: `https://your-worker-name.workers.dev/auth/gitlab/callback`
   - Scopes: 勾选 `read_user`
3. 点击 "Save application"
4. 记下 `Application ID` 和 `Secret`

### 7. 配置 Secrets

```bash
# GitHub OAuth
npx wrangler secret put GITHUB_CLIENT_ID
# 输入你的 GitHub Client ID

npx wrangler secret put GITHUB_CLIENT_SECRET
# 输入你的 GitHub Client Secret

# GitLab OAuth
npx wrangler secret put GITLAB_CLIENT_ID
# 输入你的 GitLab Application ID

npx wrangler secret put GITLAB_CLIENT_SECRET
# 输入你的 GitLab Secret

# Session 密钥（生成随机字符串）
npx wrangler secret put SESSION_SECRET
# 输入至少 32 字符的随机字符串

# JWT 密钥（生成随机字符串）
npx wrangler secret put JWT_SECRET
# 输入至少 32 字符的随机字符串
```

生成随机密钥的方法：

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL
openssl rand -hex 32
```

### 8. 部署

```bash
npm run deploy
```

部署成功后，会显示 Worker 的 URL，例如：
```
https://webhook-proxy.your-account.workers.dev
```

### 9. 验证部署

访问你的 Worker URL，应该看到登录页面。

测试健康检查：
```bash
curl https://your-worker-name.workers.dev/health
```

## 环境配置

### 开发环境

本地开发使用 `.dev.vars` 文件（不要提交到 Git）：

```bash
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars 填入实际值
```

启动本地开发服务器：

```bash
npm run dev
```

### 生产环境

使用 `wrangler.toml` 配置环境：

```toml
[env.production]
name = "webhook-proxy"

[env.production.vars]
ENVIRONMENT = "production"
```

部署到生产环境：

```bash
npx wrangler deploy --env production
```

## 自定义域名

### 1. 添加域名到 Cloudflare

确保你的域名已添加到 Cloudflare。

### 2. 配置 Worker Routes

在 Cloudflare 控制台：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Triggers" 标签
4. 添加自定义域名或路由

或在 `wrangler.toml` 中配置：

```toml
routes = [
  { pattern = "webhook.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

### 3. 更新 OAuth 回调 URL

更新 GitHub 和 GitLab OAuth 应用的回调 URL 为你的自定义域名：

- GitHub: `https://webhook.yourdomain.com/auth/github/callback`
- GitLab: `https://webhook.yourdomain.com/auth/gitlab/callback`

## 监控和日志

### 查看日志

实时查看日志：

```bash
npx wrangler tail
```

### 查看分析

在 Cloudflare 控制台查看：
- 请求数
- 错误率
- CPU 时间
- 持续时间

### 告警

可以在 Cloudflare 控制台设置告警规则。

## 更新和回滚

### 更新 Worker

```bash
git pull
npm install
npm run deploy
```

### 回滚

Cloudflare 会保留最近的部署版本，可以在控制台进行回滚：

1. 进入 Workers & Pages
2. 选择你的 Worker
3. 点击 "Deployments" 标签
4. 选择要回滚的版本
5. 点击 "Rollback"

## 数据库管理

### 查询数据库

```bash
# 本地
npx wrangler d1 execute webhook-proxy-db --local --command "SELECT * FROM users LIMIT 10"

# 生产
npx wrangler d1 execute webhook-proxy-db --command "SELECT * FROM users LIMIT 10"
```

### 备份数据库

```bash
# 导出数据
npx wrangler d1 export webhook-proxy-db --output backup.sql
```

### 新增迁移

1. 创建迁移文件 `migrations/000X_description.sql`
2. 运行迁移：
   ```bash
   npm run db:migrate
   ```

## 成本估算

### 免费套餐限制

- **Workers**: 100,000 请求/天
- **Durable Objects**: 
  - 1,000,000 请求/月
  - 400,000 GB-s 持续时间/月
- **D1**:
  - 5GB 存储
  - 100,000 行读取/天
  - 1,000 行写入/天
- **KV**:
  - 100,000 读取/天
  - 1,000 写入/天

### 付费套餐

超出免费额度后按使用量计费：
- Workers: $5/月 + $0.50/百万请求
- Durable Objects: $5/月 + $0.15/百万请求
- D1: $0.75/GB/月
- KV: $0.50/GB/月

详见 [Cloudflare Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)

## 故障排查

### Worker 无法访问

1. 检查部署状态
2. 查看错误日志：`npx wrangler tail`
3. 验证配置：检查 `wrangler.toml`

### OAuth 登录失败

1. 验证 Client ID 和 Secret
2. 检查回调 URL 是否正确
3. 查看浏览器控制台错误

### 数据库错误

1. 验证迁移已运行：`npm run db:migrate`
2. 检查 database_id 是否正确
3. 查看 D1 控制台

### WebSocket 连接失败

1. 检查 Durable Objects 配置
2. 验证 Proxy 是否存在且激活
3. 查看连接日志

### 性能问题

1. 查看 Cloudflare Analytics
2. 优化数据库查询
3. 检查是否超出配额限制
4. 考虑升级套餐

## 安全最佳实践

1. **定期轮换 Secrets**
   ```bash
   npx wrangler secret put SESSION_SECRET
   ```

2. **监控异常活动**
   - 设置告警
   - 定期检查日志

3. **限制 API 访问**
   - 实施速率限制
   - 验证请求来源

4. **保持依赖更新**
   ```bash
   npm update
   ```

## 获取帮助

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare 社区](https://community.cloudflare.com/)
- [项目 Issues](https://github.com/your-repo/issues)

## CI/CD 集成

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run db:migrate
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      
      - name: Deploy
        run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

在 GitHub 仓库设置中添加 `CLOUDFLARE_API_TOKEN` secret。

### GitLab CI

创建 `.gitlab-ci.yml`：

```yaml
deploy:
  image: node:18
  script:
    - npm ci
    - npm run db:migrate
    - npm run deploy
  only:
    - main
  variables:
    CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN
```

在 GitLab 项目设置中添加 `CLOUDFLARE_API_TOKEN` 变量。

