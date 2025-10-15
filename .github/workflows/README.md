# GitHub Actions 工作流

本项目使用 GitHub Actions 实现 CI/CD 自动化。

## 📋 工作流列表

### 1. CI (`ci.yml`)
- **触发**: Push 到 master/main/develop 分支，或 PR 到 master/main
- **功能**: 代码检查和类型验证
- **状态**: [![CI](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml)

### 2. Deploy (`deploy.yml`)
- **触发**: Push 到 master/main 分支，或手动触发
- **功能**: 自动部署到 Cloudflare Workers 生产环境
- **状态**: [![Deploy](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml)

### 3. Preview (`preview.yml`)
- **触发**: Pull Request 打开、同步或重新打开
- **功能**: 预览部署验证，在 PR 中评论结果

## 🔧 所需的 Secrets

在 GitHub 仓库中配置以下 Secrets：

| Secret Name | Description | Where to get |
|-------------|-------------|--------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | [Dashboard → API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | [Dashboard](https://dash.cloudflare.com/) (右侧边栏) |

## 📝 工作流说明

### CI 工作流
```yaml
- 检出代码
- 安装 pnpm 和 Node.js
- 安装依赖
- TypeScript 类型检查
```

### Deploy 工作流
```yaml
- 检出代码
- 安装 pnpm 和 Node.js
- 安装依赖
- TypeScript 类型检查
- 应用数据库迁移
- 部署到 Cloudflare Workers
- 生成部署摘要
```

### Preview 工作流
```yaml
- 检出代码
- 安装 pnpm 和 Node.js
- 安装依赖
- TypeScript 类型检查
- 干运行部署验证
- 在 PR 中评论结果
```

## 🚀 使用方法

### 自动部署
只需将代码推送到 master 分支：
```bash
git push origin master
```

### 手动触发部署
1. 访问 Actions 页面
2. 选择 "Deploy to Cloudflare Workers" 工作流
3. 点击 "Run workflow"
4. 选择分支并运行

## 📊 监控

- **查看运行历史**: [Actions 页面](https://github.com/lc-cn/webhook-proxy/actions)
- **查看特定工作流**: 点击上方的状态徽章
- **查看详细日志**: 点击具体的工作流运行

## 🔒 安全性

- 所有敏感信息都存储在 GitHub Secrets 中
- API Token 权限最小化
- 不在日志中输出敏感信息

## 📖 更多信息

详细配置说明请查看 [CI/CD 配置指南](../CI_CD_SETUP.md)

