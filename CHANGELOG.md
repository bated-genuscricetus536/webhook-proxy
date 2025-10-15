# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### ✨ 新增
- 🔄 添加 GitHub Actions CI/CD 自动部署
- 📝 添加 CI/CD 配置指南文档
- 🎯 PR 预览部署工作流
- ✅ 持续集成检查工作流
- 🎯 **查看 Secret 时支持选择验证方式**
  - 当 MFA 和 Passkey 都启用时，用户可以选择使用哪种方式验证
  - 提供友好的选择对话框

### 🔧 改进
- 🔄 **删除 MFA/Passkey 后自动更新 UI**
  - 删除 Passkey 后立即刷新列表
  - 禁用 MFA 后立即更新状态
  - 删除最后一个 Passkey 后自动清空列表显示

### 🐛 修复
- 📧 **修复邮件发送 401 错误**
  - 将发件人地址从 `noreply@hooks.zhin.dev` 改为 `noreply@zhin.dev`
  - 匹配 DNS Domain Lockdown 记录配置的域名
  - 解决 MailChannels 授权问题
- 🔧 修复 CI/CD 中 pnpm lockfile 不兼容问题（统一使用 pnpm 10）
- 📝 更新文档说明 pnpm 版本要求
- 🔍 修复所有 TypeScript 类型检查错误
  - Settings.tsx: 修复 maxlength 属性类型
  - Docs.tsx: 移除未使用的 props 参数
  - webhook-connection.ts: 标记未使用的参数
  - gitlab-cf.ts: 标记未使用的参数
- 🔐 **修复 Passkey "Illegal invocation" 和 "uint8ArrayToBase64url is not defined" 错误**
  - 修复 Passkey 注册时的序列化问题（Settings.tsx）
  - 修复 Passkey 登录时的序列化问题（Home.tsx）
  - 修复 Dashboard 查看 Secret 时的序列化问题（Dashboard.tsx）
  - 正确序列化 WebAuthn credential 对象为 JSON
  - 在所有页面添加必需的 Base64URL 编码/解码辅助函数

## [1.0.0] - 2025-01-15

### 🎉 首次发布

#### ✨ 核心功能
- 🔌 支持 GitHub 和 GitLab webhook 代理
- 🌐 WebSocket 和 SSE 双协议支持
- 📡 实时事件转发
- 🔒 Webhook 签名验证

#### 👤 完整用户系统
- 密码注册/登录
- GitHub OAuth 登录
- GitLab OAuth 登录
- Passkey (WebAuthn) 无密码登录
- 账号绑定（一个账号可绑定多种登录方式）

#### 🔐 安全特性
- MFA (TOTP) 双因素认证
- Passkey (WebAuthn) 支持
- 邮箱验证（集成 MailChannels）
- Access Token 认证
- Secret 掩码保护

#### 🎨 用户界面
- 精美的 Hono JSX 页面
- 响应式设计
- Dashboard 管理面板
- Settings 配置页面
- 在线文档

#### ⚡ 技术栈
- Hono 3.12+ (Web 框架)
- Cloudflare Workers (边缘计算)
- Durable Objects (WebSocket 管理)
- D1 Database (SQLite 数据库)
- KV Storage (Session 管理)
- TypeScript + ESM

#### 📦 部署支持
- 一键部署到 Cloudflare Workers
- 完整的本地开发环境
- 数据库迁移系统
- 环境配置管理

### 🐛 已知问题
- 无

### 📚 文档
- ✅ 完整的 README
- ✅ 邮件配置指南
- ✅ 在线文档页面
- ✅ API 文档
- ✅ 贡献指南

---

## 版本说明

### 版本号规则
- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 链接
- [GitHub 仓库](https://github.com/lc-cn/webhook-proxy)
- [问题反馈](https://github.com/lc-cn/webhook-proxy/issues)
- [Pull Requests](https://github.com/lc-cn/webhook-proxy/pulls)
