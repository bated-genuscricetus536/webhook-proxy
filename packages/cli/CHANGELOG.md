# Changelog

All notable changes to the Webhook Proxy CLI will be documented in this file.

## [1.0.0] - 2024-01-XX

### Added
- 初始版本发布
- GitHub OAuth 登录功能（两种方式：浏览器自动登录和手动输入 Token）
- Token 本地缓存（存储在 `~/.webhook-proxy/config.json`）
- Proxies 管理功能：
  - `list` - 列出所有 proxies
  - `create` - 创建新的 proxy（支持 9 种平台）
  - `update` - 更新现有 proxy
  - `delete` - 删除 proxy
- 配置管理功能：
  - `config show` - 显示当前配置
  - `config set-api` - 设置 API URL
  - `config set-github` - 配置 GitHub OAuth
  - `config interactive` - 交互式配置
- 自动认证检查（执行命令时自动检测登录状态）
- 交互式命令（使用 inquirer）
- 美化的命令行输出（使用 chalk 和 ora）
- 快捷命令别名（如 `whp`, `ls` 等）

### Features
- 支持的平台：github, gitlab, qqbot, telegram, stripe, jenkins, jira, sentry, generic
- 完整的错误处理和用户友好的错误消息
- 进度指示器和加载动画
- 配置文件自动创建和管理

### Documentation
- 完整的 README.md
- CLI 集成指南（CLI_INTEGRATION.md）
- 使用示例和故障排除指南

