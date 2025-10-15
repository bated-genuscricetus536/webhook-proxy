# 📚 文档结构说明

本项目文档已经过精简和整合，确保信息清晰且易于维护。

## 📖 主要文档

### README.md
**项目主文档** - 包含所有核心信息：
- ✨ 特性介绍
- 🚀 快速开始
- 🏗️ 技术栈说明
- 📦 安装和部署指南
- 🔒 安全特性（MFA、Passkey、邮箱验证）
- 📖 完整的使用说明
- 📊 API 文档
- 💰 成本分析
- 🛠️ 本地开发指南

### EMAIL_SETUP.md
**邮件配置指南** - MailChannels 邮件服务配置：
- DNS 记录配置（SPF、DKIM、DMARC）
- 域名锁定设置
- 故障排查
- 验证步骤

### CHANGELOG.md
**变更日志** - 版本历史和更新记录

### DEPLOYMENT.md
**部署文档** - 详细的生产环境部署步骤

### CONTRIBUTING.md
**贡献指南** - 如何参与项目开发

## 🗑️ 已删除的文档

以下文档已被删除，内容已整合到 README.md：

- ~~QUICKSTART.md~~ - 内容已整合到 README.md 的"快速开始"章节
- ~~LOCAL_DEVELOPMENT.md~~ - 内容已整合到 README.md 的"本地开发"章节
- ~~HONO_MIGRATION.md~~ - 迁移已完成，不再需要
- ~~MFA_SETUP_COMPLETE.md~~ - 临时文档
- ~~MFA_PASSKEY_IMPLEMENTATION_SUMMARY.md~~ - 临时文档

## 🌐 在线文档

### /docs 页面
访问 `https://your-domain.com/docs` 查看精美的在线文档，包含：

- 🚀 **快速开始** - 5 分钟上手指南
- 🔐 **用户认证** - 多种登录方式说明
- 🔒 **安全特性** - MFA、Passkey、邮箱验证
- ⚙️ **Proxy 管理** - 创建和管理 Proxy
- 🔗 **Webhook 使用** - WebSocket 和 SSE 连接
- 📖 **API 参考** - 完整的 API 端点列表
- 🚀 **部署指南** - 生产环境部署步骤

### /about 页面
访问 `https://your-domain.com/about` 查看项目介绍。

## 📝 文档维护原则

1. **单一来源** - README.md 作为主要文档
2. **专题分离** - 特殊配置（如邮件）保留独立文档
3. **保持更新** - 新功能及时更新文档
4. **用户友好** - 提供在线版本和离线版本

## 🔗 外部资源

项目相关的外部文档链接：

- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Durable Objects 文档](https://developers.cloudflare.com/durable-objects/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [GitLab Webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html)
- [WebAuthn 规范](https://www.w3.org/TR/webauthn-2/)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)

## 🤝 贡献文档

如果您发现文档问题或想要改进：

1. 在 GitHub 上创建 Issue 说明问题
2. Fork 项目并修改文档
3. 提交 Pull Request
4. 确保文档清晰且准确

感谢您的贡献！

