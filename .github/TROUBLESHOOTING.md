# CI/CD 故障排查指南

本文档记录常见的 CI/CD 问题及解决方案。

## 🔧 常见问题

### 1. pnpm lockfile 不兼容

#### 问题描述
```
WARN  Ignoring not compatible lockfile
ERR_PNPM_NO_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent
```

#### 原因
本地 pnpm 版本与 CI 中使用的版本不一致，导致 lockfile 格式不兼容。

#### 解决方案

**方案 1: 升级本地 pnpm（推荐）**
```bash
# 安装 pnpm 10
npm install -g pnpm@10

# 验证版本
pnpm --version  # 应该显示 10.x.x

# 重新生成 lockfile
rm pnpm-lock.yaml
pnpm install

# 提交更新
git add pnpm-lock.yaml
git commit -m "chore: update lockfile for pnpm 10"
git push
```

**方案 2: 修改 CI 使用的 pnpm 版本（不推荐）**

编辑所有 workflow 文件（`.github/workflows/*.yml`），修改 pnpm 版本：

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10  # 改为你本地使用的版本
```

#### 预防措施
- 团队统一使用相同的 pnpm 版本
- 在 `package.json` 中指定 pnpm 版本：
  ```json
  {
    "packageManager": "pnpm@10.18.2"
  }
  ```

---

### 2. Cloudflare API Token 权限不足

#### 问题描述
```
Error: Authentication error
```

#### 原因
API Token 权限不足或已过期。

#### 解决方案

1. **重新创建 API Token**
   - 访问 [Cloudflare Dashboard - API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - 点击 "Create Token"
   - 使用 "Edit Cloudflare Workers" 模板
   - 确保以下权限：
     - Account Resources: `Cloudflare Workers Scripts:Edit`
     - Zone Resources: `Workers Routes:Edit`（如果使用自定义域名）

2. **更新 GitHub Secret**
   - 访问 GitHub 仓库的 Settings → Secrets → Actions
   - 更新 `CLOUDFLARE_API_TOKEN`

3. **重新运行工作流**

---

### 3. 数据库迁移失败

#### 问题描述
```
Error: D1 database not found
```

#### 原因
远程 D1 数据库未创建或 ID 配置错误。

#### 解决方案

1. **检查数据库是否存在**
   ```bash
   npx wrangler d1 list
   ```

2. **创建数据库（如果不存在）**
   ```bash
   npx wrangler d1 create webhook-proxy-db
   ```

3. **更新 wrangler.toml**
   
   将创建的数据库 ID 更新到 `wrangler.toml`：
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "webhook-proxy-db"
   database_id = "your-database-id"  # 更新为实际的 ID
   ```

4. **手动运行迁移**
   ```bash
   npx wrangler d1 migrations apply webhook-proxy-db --remote
   ```

---

### 4. TypeScript 类型检查失败

#### 问题描述
```
Error: Type check failed
```

#### 原因
代码中存在 TypeScript 类型错误。

#### 解决方案

1. **本地运行类型检查**
   ```bash
   pnpm run type-check
   ```

2. **修复所有类型错误**

3. **重新提交**
   ```bash
   git add .
   git commit -m "fix: resolve type errors"
   git push
   ```

#### 预防措施
- 在提交前运行 `pnpm run type-check`
- 配置 Git pre-commit hook
- 使用 IDE 的实时类型检查

---

### 5. 工作流不触发

#### 问题描述
推送代码后 GitHub Actions 没有运行。

#### 可能原因及解决方案

**1. 分支不匹配**
- 检查 workflow 文件中的触发分支
- 确保推送到正确的分支（master/main）

**2. Workflow 文件语法错误**
- 在 GitHub 仓库的 Actions 页面查看错误信息
- 使用在线 YAML 验证器检查语法

**3. Workflow 被禁用**
- 访问 Actions 页面
- 检查 workflow 是否被禁用
- 如果被禁用，点击 "Enable workflow"

**4. 权限问题**
- 访问 Settings → Actions → General
- 确保 "Allow all actions and reusable workflows" 已选中
- 检查 "Workflow permissions" 设置

---

### 6. 部署成功但服务不可用

#### 问题描述
CI/CD 显示部署成功，但访问服务时报错。

#### 解决方案

1. **检查 Cloudflare Secrets**
   ```bash
   npx wrangler secret list
   ```
   
   确保所有必需的 secrets 都已配置：
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITLAB_CLIENT_ID`
   - `GITLAB_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `JWT_SECRET`

2. **查看 Workers 日志**
   ```bash
   npx wrangler tail --format pretty
   ```

3. **检查自定义域名配置**
   - 访问 Cloudflare Dashboard
   - 检查 Workers Routes 配置
   - 确保 DNS 记录正确

---

### 7. PR 预览失败

#### 问题描述
Pull Request 的预览部署工作流失败。

#### 解决方案

1. **检查 PR 的 Actions 日志**
   - 访问 PR 页面
   - 点击 "Checks" 标签
   - 查看详细错误信息

2. **常见原因**
   - 代码合并冲突
   - 依赖安装失败
   - 类型检查失败
   - 配置文件错误

3. **修复并重新推送**

---

## 🔍 调试技巧

### 1. 查看详细日志

在 GitHub Actions 页面：
1. 点击失败的工作流运行
2. 点击具体的 job
3. 展开每个步骤查看详细输出

### 2. 本地模拟 CI 环境

```bash
# 安装相同版本的工具
npm install -g pnpm@10

# 清理环境
rm -rf node_modules pnpm-lock.yaml

# 模拟 CI 安装
pnpm install --frozen-lockfile

# 运行类型检查
pnpm run type-check

# 模拟部署（干运行）
npx wrangler deploy --dry-run
```

### 3. 启用 Debug 日志

在 workflow 文件中添加：

```yaml
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true
```

### 4. 添加临时调试步骤

在 workflow 中添加：

```yaml
- name: 🐛 Debug info
  run: |
    echo "Node version: $(node --version)"
    echo "pnpm version: $(pnpm --version)"
    echo "Current directory: $(pwd)"
    ls -la
    cat pnpm-lock.yaml | head -n 10
```

---

## 📞 获取帮助

如果以上方案都无法解决问题：

1. **查看日志**: 仔细阅读完整的错误日志
2. **搜索 Issues**: 在 [GitHub Issues](https://github.com/lc-cn/webhook-proxy/issues) 中搜索类似问题
3. **创建 Issue**: 提供详细的错误信息、环境信息和复现步骤
4. **社区求助**: 访问 Cloudflare Workers Discord 社区

---

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [pnpm 文档](https://pnpm.io/)

---

**最后更新**: 2025-01-15

