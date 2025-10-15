# 🚀 Resend 快速配置指南

这是一个快速配置指南，帮助你在 **5 分钟内** 完成 Resend 邮件服务的集成。

## 📝 第一步：注册并获取 API Key

### 1. 注册 Resend

访问：https://resend.com/signup

**推荐使用 GitHub 快速登录** ✨

### 2. 添加域名

1. 进入 **Domains** → **Add Domain**
2. 输入你的域名：`zhin.dev`（或你的域名）
3. 点击 **Add Domain**

### 3. 配置 DNS

Resend 会显示需要添加的 DNS 记录，例如：

```
类型: TXT
名称: @
内容: resend=xxxxxxxxxxxxxxxxxxxxx
```

**去 Cloudflare DNS 添加这条记录：**

1. 登录 Cloudflare Dashboard
2. 选择域名 → DNS → Records → Add Record
3. 填写 Resend 提供的记录

**等待验证**：通常 1-10 分钟

### 4. 创建 API Key

1. 进入 **API Keys** → **Create API Key**
2. 填写：
   - Name: `webhook-proxy`
   - Permission: `Sending access`
3. 点击 **Create**
4. **复制 API Key**（格式：`re_xxxxxxxxxxxxxxxxxxxxxxxx`）

⚠️ **重要**：只显示一次，请妥善保存！

---

## 🔧 第二步：配置到 Cloudflare Workers

### 本地开发环境

编辑 `.dev.vars` 文件（如果没有，复制 `.dev.vars.example`）：

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 生产环境

运行以下命令：

```bash
# 配置生产环境
wrangler secret put RESEND_API_KEY
# 粘贴你的 API Key 并回车

# 如果你有开发环境
wrangler secret put RESEND_API_KEY --env development
```

---

## ✅ 第三步：部署和测试

### 1. 部署

```bash
wrangler deploy
```

### 2. 测试邮件发送

1. 访问你的应用（例如：https://hooks.zhin.dev）
2. 注册或登录账号
3. 进入 **Settings** 页面
4. 点击 **设置邮箱** → 输入邮箱 → **发送验证码**
5. 检查邮箱（**包括垃圾邮件箱**）

### 3. 查看日志

如果邮件未收到，查看实时日志：

```bash
npx wrangler tail --format pretty
```

### 4. Resend 控制台

在 Resend Dashboard → **Emails** 页面可以看到：
- 发送状态
- 邮件内容预览
- 送达统计

---

## 🎯 完成！

现在你的邮件服务已经配置完成！🎉

### 免费额度

✅ **3000 封/月** - 对验证码邮件来说完全够用

### 监控使用量

在 Resend 控制台可以实时查看：
- 已发送邮件数量
- 送达率
- 剩余免费额度

---

## 🔍 故障排查

### 邮件未收到？

1. ✅ 检查 **垃圾邮件箱**
2. ✅ 检查 Resend 域名验证是否通过
3. ✅ 检查 `wrangler secret list` 是否包含 `RESEND_API_KEY`
4. ✅ 查看 Resend 控制台的发送日志
5. ✅ 运行 `wrangler tail` 查看 Worker 日志

### API Key 无效？

```bash
# 查看已配置的 secrets
wrangler secret list

# 重新配置
wrangler secret put RESEND_API_KEY
```

### DNS 未生效？

等待时间：通常 1-10 分钟，最长可能 24 小时

验证方法：
```bash
dig TXT yourdomain.com +short
```

---

## 📚 相关文档

- [完整配置指南](EMAIL_SETUP.md)
- [Resend 官方文档](https://resend.com/docs)
- [问题反馈](https://github.com/lc-cn/webhook-proxy/issues)

---

**有问题？** 欢迎提交 Issue！👋

