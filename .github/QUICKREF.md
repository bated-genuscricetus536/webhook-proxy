# CI/CD 快速参考

快速查找常用命令和配置。

## 🚀 快速命令

### 本地开发
```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 类型检查
pnpm run type-check

# 本地数据库迁移
pnpm run db:migrate:local
```

### 部署
```bash
# 手动部署
pnpm run deploy

# 数据库迁移（生产）
pnpm run db:migrate

# 查看实时日志
npx wrangler tail --format pretty

# 干运行（不实际部署）
npx wrangler deploy --dry-run
```

### Secrets 管理
```bash
# 列出所有 secrets
npx wrangler secret list

# 添加 secret
npx wrangler secret put SECRET_NAME

# 删除 secret
npx wrangler secret delete SECRET_NAME
```

### 数据库操作
```bash
# 列出所有数据库
npx wrangler d1 list

# 执行 SQL（远程）
npx wrangler d1 execute webhook-proxy-db --remote --command "SELECT * FROM users;"

# 查看表结构
npx wrangler d1 execute webhook-proxy-db --remote --command ".schema"
```

## ⚙️ 配置检查清单

### GitHub Secrets（必需）
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `CLOUDFLARE_ACCOUNT_ID`

### Cloudflare Secrets（必需）
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `GITLAB_CLIENT_ID`
- [ ] `GITLAB_CLIENT_SECRET`
- [ ] `SESSION_SECRET`
- [ ] `JWT_SECRET`

### Cloudflare 资源
- [ ] D1 数据库已创建
- [ ] KV Namespace 已创建
- [ ] Durable Object 已配置
- [ ] 自定义域名已配置（可选）

## 🔄 工作流触发条件

| 工作流 | 触发条件 | 文件 |
|--------|---------|------|
| **CI** | Push 到 master/main/develop<br/>PR 到 master/main | `ci.yml` |
| **Deploy** | Push 到 master/main<br/>手动触发 | `deploy.yml` |
| **Preview** | PR 打开/同步/重开 | `preview.yml` |

## 📝 Commit 规范

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add user authentication` |
| `fix` | 修复 Bug | `fix: resolve login issue` |
| `docs` | 文档更新 | `docs: update API documentation` |
| `style` | 代码格式 | `style: format code with prettier` |
| `refactor` | 重构 | `refactor: optimize database queries` |
| `test` | 测试 | `test: add unit tests` |
| `chore` | 构建/工具 | `chore: update dependencies` |
| `perf` | 性能优化 | `perf: improve loading speed` |

## 🐛 快速故障排查

| 问题 | 快速检查 | 解决方案 |
|------|----------|----------|
| **lockfile 不兼容** | `pnpm --version` | 升级到 pnpm 10 |
| **API Token 错误** | 检查 Token 权限 | 重新创建 Token |
| **数据库错误** | `wrangler d1 list` | 创建数据库 |
| **部署失败** | 查看 Actions 日志 | 根据错误信息修复 |
| **服务不可用** | `wrangler tail` | 检查 Secrets 配置 |

## 🔗 常用链接

- **GitHub Actions**: https://github.com/lc-cn/webhook-proxy/actions
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Workers Dashboard**: https://dash.cloudflare.com/[account-id]/workers
- **API Tokens**: https://dash.cloudflare.com/profile/api-tokens
- **GitHub Issues**: https://github.com/lc-cn/webhook-proxy/issues

## 📊 状态徽章

在 README 中添加：

```markdown
[![CI](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/ci.yml)
[![Deploy](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml/badge.svg)](https://github.com/lc-cn/webhook-proxy/actions/workflows/deploy.yml)
```

## 🎯 最佳实践

### 开发流程
1. 从 master 创建功能分支
2. 在本地开发和测试
3. 运行 `pnpm run type-check`
4. 推送并创建 PR
5. 等待 CI 检查通过
6. 代码审查
7. 合并到 master
8. 自动部署

### 安全建议
- 不要在代码中硬编码密钥
- 使用 GitHub Secrets 和 Cloudflare Secrets
- 定期轮换 API Token
- 启用分支保护规则
- 要求 PR 审查

### 性能优化
- 使用 `--frozen-lockfile` 加速 CI
- 利用 Actions 缓存
- 并行运行独立的 job
- 合理配置 Cloudflare Workers 限制

## 💡 提示

- 每次推送到 master 都会触发部署
- PR 会自动运行预览检查
- 使用 `wrangler tail` 查看实时日志
- 数据库迁移会自动执行
- 环境变量在 Cloudflare Secrets 中配置

---

**快速获取帮助**: [故障排查指南](TROUBLESHOOTING.md) | [完整文档](CI_CD_SETUP.md)

