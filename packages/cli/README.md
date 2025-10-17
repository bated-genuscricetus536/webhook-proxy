# Webhook Proxy CLI

命令行工具，用于管理 webhook-proxy 的 proxies。

## 特性

- ✅ GitHub OAuth 登录
- ✅ Token 本地缓存
- ✅ Proxies 管理 (增删改查)
- ✅ 自动认证检查
- ✅ 交互式命令
- ✅ **完整 Secret 显示**：即使启用了 MFA/Passkey，CLI 也会显示完整的 `access_token` 和 `webhook_secret`（Web Dashboard 会掩码显示）

## 安装

### 从源码安装

```bash
cd cli
npm install
npm run build
npm link
```

### 发布到 npm 后安装

```bash
npm install -g webhook-proxy-cli
```

## 快速开始

### 1. 配置 API 地址

```bash
# 设置 API 地址（默认为 http://localhost:8787）
webhook-proxy config set-api https://your-api-domain.com
```

### 2. 登录

CLI 支持**多种登录方式**，满足不同场景需求：

```bash
webhook-proxy login
```

运行命令后，会显示登录方式选择菜单：

```
? 选择登录方式:
❯ 🔐 GitHub OAuth（推荐）
  🦊 GitLab OAuth
  👤 用户名/邮箱 + 密码
  🔑 Passkey / 指纹 / Face ID
  📋 手动输入 Token
```

#### 方式 1: GitHub OAuth（推荐）⭐

最安全便捷的方式：

```bash
webhook-proxy login
# 选择 "🔐 GitHub OAuth（推荐）"
```

**流程**：
1. 自动启动本地回调服务器（端口 3456）
2. 打开浏览器跳转到 GitHub OAuth 授权页面
3. 授权后自动保存 session token
4. 完成登录

**优点**：
- ✅ 最安全（OAuth 2.0 标准）
- ✅ 无需记住密码
- ✅ 支持所有 GitHub 账号
- ✅ 自动化流程

#### 方式 2: GitLab OAuth

适合 GitLab 用户：

```bash
webhook-proxy login
# 选择 "🦊 GitLab OAuth"
```

**流程和优点**与 GitHub OAuth 相同，只是使用 GitLab 账号。

#### 方式 3: 用户名/邮箱 + 密码

传统登录方式，无需浏览器：

```bash
webhook-proxy login
# 选择 "👤 用户名/邮箱 + 密码"
```

**交互示例**：
```
=== 账号密码登录 ===

? 用户名或邮箱: your-username
? 密码: ********
⠋ 正在登录...
✓ 登录成功！欢迎 your-username
```

**优点**：
- ✅ 纯 CLI 操作，无需浏览器
- ✅ 传统方式，易于理解
- ✅ 适合脚本自动化

**注意**：需要先通过 Web Dashboard 或 API 注册账号。

#### 方式 4: Passkey / 指纹 / Face ID 🆕

使用现代生物识别登录：

```bash
webhook-proxy login
# 选择 "🔑 Passkey / 指纹 / Face ID"
```

**前提条件**：
1. 需要先在 Web Dashboard 中注册 Passkey
2. 浏览器支持 WebAuthn API
3. 设备支持生物识别（指纹、Face ID 等）

**流程**：
1. CLI 自动打开浏览器到 Dashboard
2. Dashboard 自动触发 Passkey 认证
3. 使用 Passkey 认证（指纹、Face ID 等）
4. 认证成功后自动返回 CLI
5. 完成登录

**优点**：
- ✅ 最先进的认证方式
- ✅ 支持生物识别，安全便捷
- ✅ 无需记住密码
- ✅ 全自动流程

**示例**：
```
? 选择登录方式: 🔑 Passkey / 指纹 / Face ID

⠋ 正在启动 Passkey 登录...
⠙ 正在打开浏览器...
⠹ 等待 Passkey 认证...
✓ Passkey 登录成功！欢迎 username
```

#### 方式 5: 手动输入 Token（备用）

适用于特殊情况：

```bash
webhook-proxy login
# 选择 "📋 手动输入 Token"
```

**步骤**：
1. 在浏览器中访问 API 网站并登录
2. 打开浏览器开发者工具 (F12)
3. 在 Application > Cookies 中找到 "session" cookie
4. 复制 session cookie 的值
5. 在 CLI 中粘贴 token

### 3. 管理 Proxies

```bash
# 列出所有 proxies
webhook-proxy proxy list
# 或使用快捷命令
webhook-proxy ls

# 创建新的 proxy
webhook-proxy proxy create

# 更新 proxy
webhook-proxy proxy update <proxy-id>

# 删除 proxy
webhook-proxy proxy delete <proxy-id>
```

## 命令参考

### 认证命令

#### `webhook-proxy login`

登录到 Webhook Proxy。支持多种登录方式：
- GitHub OAuth（推荐）
- GitLab OAuth
- 用户名/邮箱 + 密码
- Passkey / 生物识别
- 手动输入 Token

```bash
webhook-proxy login
```

运行后会显示交互式菜单让您选择登录方式。

#### `webhook-proxy logout`

登出当前账户。

```bash
webhook-proxy logout
```

### Proxy 管理命令

#### `webhook-proxy proxy list`

列出所有 proxies。

```bash
webhook-proxy proxy list
# 别名
webhook-proxy proxy ls
# 快捷命令
webhook-proxy list
webhook-proxy ls
```

#### `webhook-proxy proxy create`

创建新的 proxy（交互式）。

```bash
webhook-proxy proxy create
```

系统会提示输入：
- Proxy 名称
- 平台（github, gitlab, qqbot, telegram, stripe, jenkins, jira, sentry, generic）
- Webhook Secret（可选）
- Platform App ID（可选，QQBot/Telegram 需要）
- 是否验证签名

#### `webhook-proxy proxy update <id>`

更新指定的 proxy（交互式）。

```bash
webhook-proxy proxy update <proxy-id>
```

#### `webhook-proxy proxy delete <id>`

删除指定的 proxy。

```bash
webhook-proxy proxy delete <proxy-id>
```

### 配置命令

#### `webhook-proxy config show`

显示当前配置。

```bash
webhook-proxy config show
```

#### `webhook-proxy config set-api <url>`

设置 API URL。

```bash
webhook-proxy config set-api https://your-api-domain.com
```

#### `webhook-proxy config set-github`

配置 GitHub OAuth（交互式）。

```bash
webhook-proxy config set-github
```

#### `webhook-proxy config interactive`

交互式配置。

```bash
webhook-proxy config interactive
# 别名
webhook-proxy config i
```

## 配置

### 配置文件

配置文件存储在 `~/.webhook-proxy/config.json`：

```json
{
  "apiUrl": "http://localhost:8787",
  "token": "your-session-token"
}
```

### 环境变量

CLI 支持通过环境变量配置：

**API_URL** - API 服务器地址

```bash
# Linux/macOS
export API_URL=https://api.your-domain.com

# Windows (PowerShell)
$env:API_URL="https://api.your-domain.com"

# 使用 CLI
webhook-proxy login
```

**优先级**（从高到低）：
1. 配置文件 (`~/.webhook-proxy/config.json`)
2. 环境变量 (`API_URL`)
3. 默认值 (`http://localhost:8787`)

详细说明请参考 [ENV_VARS.md](./ENV_VARS.md)

### Secret 处理

**重要**: CLI 始终显示完整的 `access_token` 和 `webhook_secret`，即使您在 Web Dashboard 中启用了 MFA 或 Passkey。

这是因为 CLI 需要完整的凭据才能正确配置 webhook 和 WebSocket 连接。Web Dashboard 会掩码显示敏感信息以提高安全性，但 CLI 通过特殊的请求头 (`X-Client-Type: cli`) 告诉 API 返回完整的凭据。

**安全建议**：
- 确保您的配置文件 `~/.webhook-proxy/config.json` 有适当的文件权限
- 不要在公共场合或截图中分享 CLI 输出
- 定期更新 session token（重新登录）

详细技术说明请参考根目录的 [CLI_SECRET_HANDLING.md](../../CLI_SECRET_HANDLING.md)

## 使用示例

### 完整工作流程

```bash
# 1. 配置 CLI
webhook-proxy config set-api https://your-api-domain.com

# 2. 登录
webhook-proxy login
# 选择登录方式（浏览器自动登录 或 手动输入 Token）

# 3. 查看配置确认登录成功
webhook-proxy config show

# 4. 列出现有 proxies
webhook-proxy list

# 5. 创建新的 GitHub webhook proxy
webhook-proxy proxy create
# 选择:
# - Name: My GitHub Webhook
# - Platform: github
# - Webhook Secret: my-secret-key
# - Verify Signature: Yes

# 6. 更新 proxy（比如禁用）
webhook-proxy proxy update <proxy-id>

# 7. 删除 proxy
webhook-proxy proxy delete <proxy-id>

# 8. 登出
webhook-proxy logout
```

## 自动认证

当执行需要认证的命令时，如果检测到未登录，CLI 会自动启动登录流程：

```bash
# 未登录状态下执行
webhook-proxy list
# 输出：未登录，正在启动登录流程...
# 然后自动打开浏览器进行 GitHub 授权
```

## 故障排除

### 登录失败

**浏览器自动登录失败**：
1. **后端不支持 CLI 回调**：切换到"手动输入 Token"方式，或者参考 [CLI_INTEGRATION.md](./CLI_INTEGRATION.md) 配置后端
2. **端口被占用**：确保端口 3456 未被占用
3. **浏览器阻止弹窗**：手动打开 CLI 显示的 URL

**手动输入 Token 失败**：
1. **Token 复制错误**：确保完整复制 session cookie 的值
2. **Token 已过期**：重新登录后端网站并复制新 token

### API 请求失败

1. **API 地址错误**：使用 `webhook-proxy config show` 检查 API URL
2. **Token 过期**：重新登录 `webhook-proxy login`
3. **网络问题**：确保可以访问 API 服务器

### 重置配置

```bash
# 删除配置文件
rm -rf ~/.webhook-proxy
```

## 开发

```bash
# 克隆仓库
git clone https://github.com/lc-cn/webhook-proxy.git
cd webhook-proxy/cli

# 安装依赖
npm install

# 开发模式（自动编译）
npm run dev

# 构建
npm run build

# 本地测试
npm link
```

## 许可证

MIT

## 相关链接

- [Webhook Proxy 主项目](https://github.com/lc-cn/webhook-proxy)
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)

