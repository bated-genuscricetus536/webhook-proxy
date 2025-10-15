# 📧 邮件发送配置指南

本项目使用 **Resend** 发送邮件（如邮箱验证码）。Resend 是一个专为开发者设计的现代邮件发送服务。

## ✨ 为什么选择 Resend？

- ✅ **免费额度充足**：3000 封/月
- ✅ **简单易用**：API 设计简洁，文档清晰
- ✅ **高送达率**：专业的邮件基础设施
- ✅ **实时日志**：可在控制台查看每封邮件的发送状态
- ✅ **与 Cloudflare Workers 完美兼容**：基于 HTTP API，无需 SMTP

## 📋 前置条件

- ✅ 拥有自定义域名（例如：`zhin.dev`）
- ✅ 域名托管在 Cloudflare DNS（或其他 DNS 提供商）

## 🚀 配置步骤

### 1. 注册 Resend 账号

访问 https://resend.com/signup 注册账号（推荐使用 GitHub 快速登录）

### 2. 添加域名

1. 登录 Resend 控制台
2. 进入 **Domains** → **Add Domain**
3. 输入你的域名（例如：`zhin.dev`）
4. 点击 **Add Domain**

### 3. 配置 DNS 记录

Resend 会显示需要添加的 DNS 记录，通常包括：

#### 示例 DNS 记录

```
类型: TXT
名称: @
内容: resend=xxxxxxxxxxxxxxxxxxxxx
TTL: Auto
```

**在 Cloudflare DNS 中添加这些记录：**

1. 登录 Cloudflare Dashboard
2. 选择你的域名
3. 进入 **DNS** → **Records**
4. 根据 Resend 提供的记录添加

**注意**：DNS 记录通常需要几分钟到几小时才能生效。

### 4. 验证域名

1. 添加 DNS 记录后，回到 Resend 控制台
2. 点击 **Verify Domain**
3. 等待验证通过（通常几分钟内完成）

### 5. 创建 API Key

1. 在 Resend 控制台进入 **API Keys**
2. 点击 **Create API Key**
3. 填写以下信息：
   - **Name**: `webhook-proxy-production`
   - **Permission**: `Sending access`
4. 点击 **Create**
5. **复制生成的 API Key**（格式：`re_xxxxxxxxxxxxxxxxxxxxxxxx`）

⚠️ **重要**：API Key 只会显示一次，请妥善保存！

### 6. 配置 Cloudflare Workers

将 API Key 添加到 Cloudflare Workers 的环境变量中：

```bash
# 生产环境
wrangler secret put RESEND_API_KEY --env production
# 粘贴你的 API Key: re_xxxxxxxxxxxxxxxxxxxxxxxx

# 开发环境（可选）
wrangler secret put RESEND_API_KEY --env development
```

**或者在本地开发时，添加到 `.dev.vars` 文件：**

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 7. 验证配置

1. 部署你的 Worker：
   ```bash
   wrangler deploy
   ```

2. 访问你的应用并尝试发送验证码

3. 查看 Resend 控制台的 **Emails** 页面，可以看到发送记录

## 📊 监控邮件发送

在 Resend 控制台的 **Emails** 页面，你可以：

- 查看每封邮件的发送状态
- 查看邮件内容预览
- 查看送达率统计
- 查看退信原因

## 🔍 常见问题

### 1. 邮件未收到？

**检查项：**
- ✅ DNS 记录是否正确配置并生效
- ✅ 域名是否已在 Resend 中验证通过
- ✅ 检查**垃圾邮件箱**（首次发送的邮件可能被标记为垃圾邮件）
- ✅ 在 Resend 控制台查看邮件发送日志

### 2. API Key 配置错误？

检查 Cloudflare Workers 的 Secrets：

```bash
# 查看已配置的 secrets
wrangler secret list

# 重新设置 RESEND_API_KEY
wrangler secret put RESEND_API_KEY
```

### 3. 免费额度不够用？

Resend 免费版提供 **3000 封/月**：
- 如果是验证码邮件，通常完全够用
- 如果需要更多额度，可以升级到付费计划

### 4. 如何更换发件人邮箱？

在代码中修改 `src/utils/email.ts`：

```typescript
const fromEmail = from?.email || 'noreply@zhin.dev';  // 修改这里
const fromName = from?.name || 'Webhook Proxy';       // 修改这里
```

**注意**：发件人邮箱的域名必须是已在 Resend 中验证的域名。

## 🔐 安全建议

1. **保护 API Key**：
   - ❌ 不要将 API Key 提交到 Git
   - ✅ 使用 Cloudflare Secrets 存储
   - ✅ 定期轮换 API Key

2. **限制权限**：
   - 仅授予 "Sending access" 权限
   - 为不同环境创建不同的 API Key

3. **监控使用量**：
   - 定期检查 Resend 控制台的使用统计
   - 设置邮件发送频率限制，防止滥用

## 📚 相关资源

- [Resend 官方文档](https://resend.com/docs)
- [Resend API 参考](https://resend.com/docs/api-reference/introduction)
- [Resend 最佳实践](https://resend.com/docs/best-practices)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)

## 💡 提示

- 在开发环境中，验证码会同时输出到控制台日志中，方便调试
- 生产环境中，建议启用邮件发送失败的告警通知
- 可以在 Resend 中自定义邮件模板，提升品牌一致性

---

**配置完成后，你的应用就可以发送邮件了！** 🎉

