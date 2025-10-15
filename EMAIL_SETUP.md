# 📧 邮件发送配置指南

本项目使用 **MailChannels** 通过 Cloudflare Workers 发送邮件。MailChannels 是 Cloudflare 推荐的免费邮件发送服务，无需 API Key。

## 📋 前置条件

- ✅ 已部署 Cloudflare Worker
- ✅ 拥有自定义域名（例如：`hooks.zhin.dev`）
- ✅ 域名托管在 Cloudflare DNS

## 🔧 配置步骤

### 1. 添加 SPF 记录

SPF (Sender Policy Framework) 记录告诉收件服务器哪些服务器被授权发送来自您域名的邮件。

在 Cloudflare DNS 中添加以下 TXT 记录：

```
类型: TXT
名称: @
内容: v=spf1 include:relay.mailchannels.net ~all
TTL: Auto
```

**或者**，如果您已经有 SPF 记录，请在 `~all` 之前添加 `include:relay.mailchannels.net`：

```
v=spf1 include:_spf.google.com include:relay.mailchannels.net ~all
```

### 2. 添加 DKIM 记录（可选但推荐）

DKIM (DomainKeys Identified Mail) 为邮件添加数字签名，提高邮件的可信度。

**步骤 1**: 生成 DKIM 密钥对

访问 https://dkimcore.org/tools/ 或使用以下命令生成：

```bash
openssl genrsa -out dkim_private.pem 1024
openssl rsa -in dkim_private.pem -pubout -outform der 2>/dev/null | openssl base64 -A
```

**步骤 2**: 在 Cloudflare DNS 中添加 DKIM 记录：

```
类型: TXT
名称: mailchannels._domainkey
内容: v=DKIM1; k=rsa; p=YOUR_PUBLIC_KEY
TTL: Auto
```

将 `YOUR_PUBLIC_KEY` 替换为您生成的公钥。

### 3. 添加 DMARC 记录（可选但推荐）

DMARC 策略告诉收件服务器如何处理未通过 SPF 和 DKIM 验证的邮件。

在 Cloudflare DNS 中添加：

```
类型: TXT
名称: _dmarc
内容: v=DMARC1; p=quarantine; rua=mailto:your-email@example.com
TTL: Auto
```

策略说明：
- `p=none`: 不采取任何行动（仅监控）
- `p=quarantine`: 将可疑邮件放入垃圾箱
- `p=reject`: 拒绝可疑邮件

### 4. 添加域名锁定（推荐）

为了防止他人滥用您的域名通过 MailChannels 发送邮件，建议添加域名锁定记录。

在 Cloudflare DNS 中添加：

```
类型: TXT
名称: _mailchannels
内容: v=mc1 cfid=your-cloudflare-account-id
TTL: Auto
```

将 `your-cloudflare-account-id` 替换为您的 Cloudflare Account ID（可在 Cloudflare Dashboard 右侧找到）。

## ✅ 验证配置

### 1. 检查 DNS 记录

使用以下命令验证 DNS 记录是否生效：

```bash
# 检查 SPF 记录
dig TXT hooks.zhin.dev +short | grep spf

# 检查 DKIM 记录
dig TXT mailchannels._domainkey.hooks.zhin.dev +short

# 检查 DMARC 记录
dig TXT _dmarc.hooks.zhin.dev +short

# 检查域名锁定
dig TXT _mailchannels.hooks.zhin.dev +short
```

### 2. 测试发送邮件

1. 登录到 `https://hooks.zhin.dev`
2. 进入 Settings 页面
3. 点击"设置邮箱"
4. 输入您的邮箱地址
5. 点击"发送验证码"
6. 检查您的邮箱（包括垃圾箱）

### 3. 使用在线工具验证

- **MX Toolbox**: https://mxtoolbox.com/spf.aspx
- **DMARC Analyzer**: https://www.dmarcanalyzer.com/
- **Mail Tester**: https://www.mail-tester.com/

## 📝 当前配置

### 发件人信息

默认发件人：`noreply@hooks.zhin.dev`

可在 `src/utils/email.ts` 中修改：

```typescript
const fromEmail = from?.email || 'noreply@hooks.zhin.dev';
const fromName = from?.name || 'Webhook Proxy';
```

### 邮件模板

邮件模板位于 `src/utils/email.ts` 中的 `sendVerificationEmail` 函数。

包含：
- 精美的 HTML 邮件模板
- 纯文本备选内容
- 响应式设计
- 品牌化样式

## 🔍 故障排查

### 问题 1: 收不到邮件

**可能原因**：
1. SPF 记录未生效（DNS 传播需要时间，最多 48 小时）
2. 邮件被标记为垃圾邮件
3. 收件地址错误

**解决方案**：
- 等待 DNS 记录生效
- 检查垃圾箱
- 查看 Worker 日志：`wrangler tail --format pretty`

### 问题 2: 邮件进入垃圾箱

**可能原因**：
- 缺少 DKIM 记录
- 缺少 DMARC 记录
- 域名信誉度低

**解决方案**：
- 配置完整的 SPF、DKIM、DMARC 记录
- 避免发送大量邮件
- 确保邮件内容质量

### 问题 3: MailChannels API 返回错误

**查看日志**：
```bash
wrangler tail --format pretty
```

**常见错误**：
- `401 Unauthorized`: 域名锁定配置错误
- `451 Domain not allowed`: SPF 记录配置错误
- `550 Rejected`: 收件地址无效或被拒绝

## 📚 更多资源

- [MailChannels 文档](https://mailchannels.zendesk.com/hc/en-us)
- [Cloudflare Workers 邮件发送示例](https://developers.cloudflare.com/workers/examples/send-emails/)
- [SPF 记录生成器](https://www.spfwizard.net/)
- [DKIM 记录生成器](https://dkimcore.org/tools/)

## 🎯 快速配置检查清单

- [ ] 添加 SPF 记录
- [ ] 添加 DKIM 记录（推荐）
- [ ] 添加 DMARC 记录（推荐）
- [ ] 添加域名锁定记录（推荐）
- [ ] 等待 DNS 传播（最多 48 小时）
- [ ] 测试发送邮件
- [ ] 检查邮件是否到达
- [ ] 验证邮件未进入垃圾箱

---

**注意**：在开发环境 (`ENVIRONMENT=development`)，验证码仍会在响应中返回 `debug_code` 字段，方便测试。在生产环境，该字段不会返回，用户必须查收邮件。

