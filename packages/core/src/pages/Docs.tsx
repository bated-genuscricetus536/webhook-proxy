import { FC } from 'hono/jsx';

export const Docs: FC<{}> = () => {
  const docsStyle = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      padding: 20px;
    }
    .docs-container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .docs-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .docs-header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .docs-header p {
      font-size: 1.2em;
      opacity: 0.9;
    }
    .docs-nav {
      background: #f8fafc;
      padding: 20px 40px;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .docs-nav a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.3s;
    }
    .docs-nav a:hover {
      background: #667eea;
      color: white;
    }
    .docs-content {
      padding: 40px;
    }
    .docs-section {
      margin-bottom: 50px;
    }
    .docs-section h2 {
      color: #667eea;
      font-size: 2em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .docs-section h3 {
      color: #1e293b;
      font-size: 1.5em;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .docs-section p {
      color: #64748b;
      line-height: 1.8;
      margin-bottom: 15px;
    }
    .docs-section ul, .docs-section ol {
      color: #64748b;
      line-height: 1.8;
      margin-left: 20px;
      margin-bottom: 15px;
    }
    .docs-section li {
      margin-bottom: 10px;
    }
    .code-block {
      background: #1e293b;
      color: #e2e8f0;
      padding: 20px;
      border-radius: 10px;
      overflow-x: auto;
      margin: 20px 0;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
    }
    .inline-code {
      background: #f1f5f9;
      color: #667eea;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .success {
      background: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .btn {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
      border: none;
      cursor: pointer;
      margin-right: 10px;
      margin-top: 10px;
    }
    .btn:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: #64748b;
    }
    .btn-secondary:hover {
      background: #475569;
    }
  `;

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>文档 - Webhook Proxy</title>
        
        {/* Highlight.js */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/bash.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/javascript.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/typescript.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/json.min.js"></script>
        
        <style>{docsStyle}</style>
        <style>{`
          /* Highlight.js 自定义样式 */
          pre {
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
          }
          pre code {
            display: block;
            padding: 20px;
            overflow-x: auto;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            line-height: 1.6;
          }
          .hljs {
            background: #0d1117 !important;
          }
        `}</style>
      </head>
      <body>
        <script>
          {`document.addEventListener('DOMContentLoaded', function() {
            hljs.highlightAll();
          });`}
        </script>
        <div class="docs-container">
          <div class="docs-header">
            <h1>📚 Webhook Proxy 文档</h1>
            <p>完整的使用指南和 API 文档</p>
          </div>

          <div class="docs-nav">
            <a href="#quick-start">快速开始</a>
            <a href="#authentication">用户认证</a>
            <a href="#security">安全特性</a>
            <a href="#proxy-management">Proxy 管理</a>
            <a href="#cli-tool">CLI 工具</a>
            <a href="#webhook-usage">Webhook 使用</a>
            <a href="#qqbot-integration">QQ Bot 集成</a>
            <a href="#telegram-integration">Telegram 集成</a>
            <a href="#api-reference">API 参考</a>
            <a href="#ci-cd">CI/CD 部署</a>
            <a href="#deployment">部署指南</a>
          </div>

          <div class="docs-content">
            {/* 快速开始 */}
            <div class="docs-section" id="quick-start">
              <h2>🚀 快速开始</h2>
              
              <h3>1. 登录系统</h3>
              <p>访问首页，使用 GitHub 或 GitLab 账号登录：</p>
              <pre><code class="language-bash">http://localhost:8787</code></pre>
              <p>点击登录按钮后，系统会引导你完成 OAuth 授权流程。</p>

              <h3>2. 创建 Proxy</h3>
              <p>登录成功后，在 Dashboard 页面点击"创建 Proxy"按钮：</p>
              <ul>
                <li><strong>名称</strong>：为你的 Proxy 起一个便于识别的名字</li>
                <li><strong>平台</strong>：选择 GitHub 或 GitLab</li>
                <li><strong>Webhook Secret</strong>：可选，用于签名验证</li>
                <li><strong>启用签名验证</strong>：建议生产环境启用</li>
              </ul>

              <h3>3. 配置 Webhook</h3>
              <p>创建成功后，复制生成的 Webhook URL，在 GitHub/GitLab 中配置：</p>
              
              <div class="info">
                <strong>GitHub 配置：</strong><br/>
                Settings → Webhooks → Add webhook<br/>
                Payload URL: 粘贴 Webhook URL<br/>
                Content type: application/json
              </div>

              <div class="info">
                <strong>GitLab 配置：</strong><br/>
                Settings → Webhooks<br/>
                URL: 粘贴 Webhook URL<br/>
                选择触发事件
              </div>

              <h3>4. 接收事件</h3>
              <p>使用 WebSocket 或 SSE 连接到对应的 URL，开始接收实时事件：</p>
              <pre><code class="language-javascript">{`// WebSocket 方式
const ws = new WebSocket('wss://your-worker.workers.dev/github/xxx/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
};

// SSE 方式
const es = new EventSource('https://your-worker.workers.dev/github/xxx/sse');
es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
};`}</code></pre>
            </div>

            {/* 用户认证 */}
            <div class="docs-section" id="authentication">
              <h2>🔐 用户认证</h2>
              
              <h3>多种登录方式</h3>
              <p>系统支持以下登录方式：</p>
              <ul>
                <li><strong>用户名/邮箱 + 密码</strong> - 传统登录方式</li>
                <li><strong>GitHub OAuth</strong> - GitHub 账号登录</li>
                <li><strong>GitLab OAuth</strong> - GitLab 账号登录</li>
                <li><strong>Passkey (WebAuthn)</strong> - 无密码登录（生物识别或硬件密钥）</li>
              </ul>

              <h3>用户注册</h3>
              <p>新用户可以通过用户名/邮箱/密码注册：</p>
              <pre><code class="language-bash">{`POST /api/account/register
Content-Type: application/json

{
  "username": "your-username",
  "email": "your-email@example.com",
  "password": "your-secure-password"
}`}</code></pre>

              <h3>账号绑定</h3>
              <p>登录后，可以在设置页面绑定多种登录方式：</p>
              <ul>
                <li>密码注册的用户可以绑定 GitHub/GitLab OAuth</li>
                <li>OAuth 登录的用户可以设置密码</li>
                <li>所有用户都可以注册 Passkey</li>
              </ul>

              <h3>Session 管理</h3>
              <p>登录后，系统会设置一个 Session Cookie：</p>
              <pre><code class="language-bash">{`Set-Cookie: session=<token>; Path=/; SameSite=Lax; Max-Age=2592000`}</code></pre>
              <p>Session 有效期为 30 天，过期后需要重新登录。</p>

              <h3>退出登录</h3>
              <p>访问 <span class="inline-code">/auth/logout</span> 清除 Session。</p>
            </div>

            {/* 安全特性 */}
            <div class="docs-section" id="security">
              <h2>🔒 安全特性</h2>
              
              <h3>MFA (Multi-Factor Authentication)</h3>
              <p>双因素认证提供额外的安全保护：</p>
              <ul>
                <li>基于 TOTP (Time-based One-Time Password) 协议</li>
                <li>支持所有主流认证器应用（Google Authenticator、Authy 等）</li>
                <li>启用后，查看 Proxy 的 Secret 需要验证</li>
              </ul>
              
              <div class="info">
                <strong>📱 设置步骤：</strong><br/>
                1. 访问 Settings 页面<br/>
                2. 点击"设置 MFA"<br/>
                3. 扫描二维码或手动输入密钥<br/>
                4. 输入验证码完成设置
              </div>

              <h3>Passkey (WebAuthn)</h3>
              <p>无密码登录，更安全更便捷：</p>
              <ul>
                <li>使用生物识别（指纹、Face ID）或硬件密钥</li>
                <li>基于 W3C WebAuthn 标准</li>
                <li>抵御钓鱼攻击和密码泄露</li>
                <li>可以注册多个 Passkey</li>
              </ul>

              <div class="info">
                <strong>🔑 设置步骤：</strong><br/>
                1. 访问 Settings 页面<br/>
                2. 点击"注册 Passkey"<br/>
                3. 按照浏览器提示完成验证<br/>
                4. 给 Passkey 起个名字（如 "MacBook Pro"）
              </div>

              <h3>邮箱验证</h3>
              <p>验证邮箱地址以增强账号安全：</p>
              <ul>
                <li>注册时提供邮箱地址</li>
                <li>系统发送 6 位验证码到邮箱</li>
                <li>验证码有效期 10 分钟</li>
                <li>OAuth 登录的邮箱自动标记为已验证</li>
              </ul>

              <h3>Webhook 签名验证</h3>
              <p>创建 Proxy 时可以启用签名验证：</p>
              <ul>
                <li><strong>GitHub</strong>：HMAC-SHA256 签名验证</li>
                <li><strong>GitLab</strong>：Token 验证</li>
                <li>防止未授权的请求</li>
                <li>确保数据完整性</li>
              </ul>

              <h3>Access Token</h3>
              <p>每个 Proxy 都有唯一的 Access Token：</p>
              <ul>
                <li>用于 WebSocket/SSE 连接认证</li>
                <li>启用 MFA/Passkey 后，Token 会被掩码保护</li>
                <li>需要验证后才能查看完整 Token</li>
              </ul>
            </div>

            {/* Proxy 管理 */}
            <div class="docs-section" id="proxy-management">
              <h2>⚙️ Proxy 管理</h2>
              
              <h3>创建 Proxy</h3>
              <pre><code class="language-bash">{`POST /api/proxies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project",
  "platform": "github",
  "webhook_secret": "optional-secret",
  "verify_signature": true
}`}</code></pre>

              <h3>列出所有 Proxies</h3>
              <pre><code class="language-bash">{`GET /api/proxies
Authorization: Bearer <token>`}</code></pre>

              <h3>更新 Proxy</h3>
              <pre><code class="language-bash">{`PUT /api/proxies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "active": false
}`}</code></pre>

              <h3>删除 Proxy</h3>
              <pre><code class="language-bash">{`DELETE /api/proxies/:id
Authorization: Bearer <token>`}</code></pre>

              <div class="warning">
                <strong>⚠️ 注意：</strong>删除 Proxy 后，所有关联的 Webhook URL 将失效，且操作不可恢复。
              </div>
            </div>

            {/* CLI 工具 */}
            <div class="docs-section" id="cli-tool">
              <h2>💻 CLI 命令行工具</h2>
              
              <p>除了 Web Dashboard，我们还提供了强大的命令行工具，让你在终端中快速管理 Proxies！</p>

              <div class="success">
                <strong>🌟 为什么选择 CLI？</strong><br/>
                - 🌐 <strong>开箱即用</strong>：默认连接到官方服务 https://hooks.zhin.dev<br/>
                - 🚀 <strong>更快捷</strong>：无需打开浏览器，命令行操作更高效<br/>
                - 🔐 <strong>多种登录</strong>：支持 GitHub、GitLab、密码、Passkey<br/>
                - 🛡️ <strong>完整信息</strong>：显示完整的 access_token 和 webhook_secret<br/>
                - 🎨 <strong>友好界面</strong>：彩色输出和交互式命令<br/>
                - ⚙️ <strong>可自建</strong>：支持连接到自己部署的服务
              </div>

              <h3>安装</h3>
              <pre><code class="language-bash">{`# 使用 npm 全局安装
npm install -g webhook-proxy-cli

# 或使用 yarn
yarn global add webhook-proxy-cli

# 验证安装
webhook-proxy --version`}</code></pre>

              <h3>快速开始</h3>
              <p><strong>1. 直接登录（官方服务用户）</strong></p>
              <pre><code class="language-bash">{`# 运行登录命令
webhook-proxy login

# 选择登录方式：
# ❯ 🔐 GitHub OAuth（推荐）
#   🦊 GitLab OAuth
#   👤 用户名/邮箱 + 密码
#   🔑 Passkey / 指纹 / Face ID
#   📋 手动输入 Token

# CLI 会自动打开浏览器完成 OAuth 授权
# 或根据提示输入用户名密码
# 登录成功后自动保存 session token`}</code></pre>

              <div class="info">
                <strong>💡 官方服务用户无需配置！</strong><br/>
                CLI 默认连接到 <span class="inline-code">https://hooks.zhin.dev</span>，直接登录即可使用。
              </div>

              <p><strong>2. 自建服务用户（可选）</strong></p>
              <p>如果你自建了 webhook-proxy 服务，需要先配置 API 地址：</p>
              <pre><code class="language-bash">{`# 设置自建服务地址
webhook-proxy config set-api https://your-api-domain.com

# 然后再登录
webhook-proxy login`}</code></pre>

              <h3>常用命令</h3>
              
              <p><strong>列出所有 Proxies：</strong></p>
              <pre><code class="language-bash">{`# 完整命令
webhook-proxy proxy list

# 快捷命令
webhook-proxy list
webhook-proxy ls`}</code></pre>

              <p><strong>创建新的 Proxy：</strong></p>
              <pre><code class="language-bash">{`# 交互式创建
webhook-proxy proxy create

# 按提示输入：
# - Name: My GitHub Webhook
# - Platform: github / gitlab / qqbot / telegram
# - Webhook Secret: 可选
# - Verify Signature: Yes/No`}</code></pre>

              <p><strong>查看 Proxy 详情：</strong></p>
              <pre><code class="language-bash">{`# 使用 Proxy ID
webhook-proxy proxy get <proxy-id>

# 快捷命令
webhook-proxy get <proxy-id>`}</code></pre>

              <p><strong>更新 Proxy：</strong></p>
              <pre><code class="language-bash">{`# 交互式更新
webhook-proxy proxy update <proxy-id>

# 快捷命令
webhook-proxy update <proxy-id>`}</code></pre>

              <p><strong>删除 Proxy：</strong></p>
              <pre><code class="language-bash">{`# 删除（需确认）
webhook-proxy proxy delete <proxy-id>

# 快捷命令
webhook-proxy delete <proxy-id>
webhook-proxy del <proxy-id>
webhook-proxy rm <proxy-id>`}</code></pre>

              <p><strong>配置管理：</strong></p>
              <pre><code class="language-bash">{`# 查看当前配置
webhook-proxy config show

# 设置 API 地址（自建服务）
webhook-proxy config set-api https://your-api-domain.com

# 交互式配置
webhook-proxy config interactive
webhook-proxy config i`}</code></pre>

              <p><strong>退出登录：</strong></p>
              <pre><code class="language-bash">{`webhook-proxy logout`}</code></pre>

              <h3>完整工作流示例</h3>
              <pre><code class="language-bash">{`# 1. 登录
webhook-proxy login
# 选择 "🔐 GitHub OAuth"
# ✓ 登录成功！欢迎 your-username

# 2. 查看现有 Proxies
webhook-proxy list
# 显示所有 Proxy 列表

# 3. 创建新的 GitHub Proxy
webhook-proxy create
# Name: My Project
# Platform: github
# Webhook Secret: my-secret-key
# Verify Signature: Yes
# ✓ Proxy 创建成功！

# 4. 查看 Proxy 详情（包含完整 access_token）
webhook-proxy get abc123
# 显示完整信息，包括：
# - ID
# - Name
# - Platform
# - Webhook URL
# - WebSocket URL
# - SSE URL
# - Access Token（完整，不掩码）
# - Webhook Secret（完整，不掩码）

# 5. 更新 Proxy
webhook-proxy update abc123
# 按提示修改信息

# 6. 删除 Proxy
webhook-proxy delete abc123
# 确认后删除`}</code></pre>

              <h3>CLI vs Web Dashboard</h3>
              <p>CLI 和 Web Dashboard 各有优势，可以根据场景选择：</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">功能</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">CLI</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">Web Dashboard</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">快速操作</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 极快</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">⚪ 中等</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">显示完整 Secret</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 始终显示</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">⚠️ MFA/Passkey 掩码</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">批量操作</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 适合</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">⚪ 一般</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">脚本自动化</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 完美</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">❌ 不支持</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">可视化界面</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">⚪ 文本</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 图形化</td>
                  </tr>
                  <tr style="background: #f8fafc;">
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">适合新手</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">⚪ 需学习</td>
                    <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">✅ 更直观</td>
                  </tr>
                </tbody>
              </table>

              <div class="info">
                <strong>💡 推荐使用场景：</strong><br/>
                - <strong>CLI</strong>：开发人员、DevOps、自动化脚本、快速操作、需要完整 Secret<br/>
                - <strong>Web Dashboard</strong>：新手、可视化操作、安全管理（启用 MFA/Passkey）
              </div>

              <h3>📦 GitHub 仓库</h3>
              <p>Webhook Proxy 是一个开源项目，欢迎查看源码、提交 Issue 和贡献代码！</p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; margin: 30px 0;">
                <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                  <div style="flex: 1; min-width: 250px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 1.8em;">⭐ 给我们一个 Star！</h3>
                    <p style="margin: 0 0 15px 0; font-size: 1.1em; opacity: 0.95;">
                      如果你觉得这个项目有用，请在 GitHub 上给我们一个 Star！<br/>
                      这是对开发者最大的鼓励和支持 🙏
                    </p>
                    <a 
                      href="https://github.com/lc-cn/webhook-proxy" 
                      target="_blank" 
                      rel="noopener"
                      style="display: inline-block; background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: 700; font-size: 1.1em; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s;"
                      onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)'"
                      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'"
                    >
                      ⭐ Star on GitHub
                    </a>
                  </div>
                  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; min-width: 200px;">
                    <div style="margin-bottom: 15px;">
                      <strong style="font-size: 1.1em;">📂 主仓库</strong><br/>
                      <a href="https://github.com/lc-cn/webhook-proxy" target="_blank" rel="noopener" style="color: white; text-decoration: underline;">
                        github.com/lc-cn/webhook-proxy
                      </a>
                    </div>
                    <div>
                      <strong style="font-size: 1.1em;">💻 CLI 包</strong><br/>
                      <a href="https://www.npmjs.com/package/webhook-proxy-cli" target="_blank" rel="noopener" style="color: white; text-decoration: underline;">
                        npmjs.com/package/webhook-proxy-cli
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div class="success">
                <strong>🎉 加入社区！</strong><br/>
                - 🐛 <a href="https://github.com/lc-cn/webhook-proxy/issues" target="_blank" rel="noopener">报告 Bug</a> - 遇到问题？提交 Issue<br/>
                - 💡 <a href="https://github.com/lc-cn/webhook-proxy/issues/new?labels=enhancement" target="_blank" rel="noopener">功能建议</a> - 有好想法？告诉我们<br/>
                - 🤝 <a href="https://github.com/lc-cn/webhook-proxy/pulls" target="_blank" rel="noopener">贡献代码</a> - Pull Request 欢迎<br/>
                - 📖 <a href="https://github.com/lc-cn/webhook-proxy#readme" target="_blank" rel="noopener">阅读文档</a> - 完整使用指南<br/>
                - ⭐ <a href="https://github.com/lc-cn/webhook-proxy/stargazers" target="_blank" rel="noopener">Star 项目</a> - 支持我们持续开发
              </div>

              <h3>技术栈</h3>
              <p>了解项目使用的技术：</p>
              <ul>
                <li><strong>CLI</strong>：TypeScript + Commander.js + Inquirer.js + Chalk + Ora</li>
                <li><strong>后端</strong>：Cloudflare Workers + Hono + D1 + KV + Durable Objects</li>
                <li><strong>前端</strong>：Hono JSX + Vanilla JavaScript</li>
                <li><strong>认证</strong>：OAuth 2.0 + WebAuthn (Passkey) + TOTP (MFA)</li>
                <li><strong>CI/CD</strong>：GitHub Actions + pnpm Monorepo</li>
              </ul>

              <div class="info">
                <strong>📚 更多资源：</strong><br/>
                - CLI 完整文档：查看项目仓库的 <span class="inline-code">packages/cli/README.md</span><br/>
                - 部署指南：<a href="#deployment">手动部署</a> 或 <a href="#ci-cd">CI/CD 自动部署</a><br/>
                - 示例代码：<span class="inline-code">examples/</span> 目录<br/>
                - 变更日志：<span class="inline-code">CHANGELOG.md</span>
              </div>
            </div>

            {/* Webhook 使用 */}
            <div class="docs-section" id="webhook-usage">
              <h2>🔗 Webhook 使用</h2>
              
              <h3>Webhook 端点</h3>
              <p>每个 Proxy 生成三个 URL：</p>
              <ul>
                <li><strong>Webhook URL</strong>：<span class="inline-code">/[platform]/[random-key]</span></li>
                <li><strong>WebSocket URL</strong>：<span class="inline-code">/[platform]/[random-key]/ws</span></li>
                <li><strong>SSE URL</strong>：<span class="inline-code">/[platform]/[random-key]/sse</span></li>
              </ul>

              <h3>签名验证</h3>
              <p>如果启用了签名验证，系统会验证以下请求头：</p>
              <ul>
                <li><strong>GitHub</strong>：<span class="inline-code">X-Hub-Signature-256</span></li>
                <li><strong>GitLab</strong>：<span class="inline-code">X-Gitlab-Token</span></li>
              </ul>

              <h3>事件格式</h3>
              <p>接收到的事件包含以下字段：</p>
              <pre><code class="language-json">{`{
  "id": "github-1234567890-abcdef",
  "type": "push",
  "platform": "github",
  "timestamp": 1234567890000,
  "raw": { /* 原始 webhook 数据 */ },
  "headers": {
    "x-github-event": "push",
    "x-github-delivery": "..."
  }
}`}</code></pre>

              <h3>WebSocket 连接示例</h3>
              <pre><code class="language-javascript">{`const ws = new WebSocket('wss://your-worker.workers.dev/github/xxx/ws');

ws.onopen = () => {
  console.log('WebSocket 已连接');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('事件类型:', data.type);
  console.log('原始数据:', data.raw);
};

ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};

ws.onclose = () => {
  console.log('WebSocket 已断开');
};`}</code></pre>

              <h3>SSE 连接示例</h3>
              <pre><code class="language-javascript">{`const eventSource = new EventSource(
  'https://your-worker.workers.dev/github/xxx/sse'
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到事件:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE 错误:', error);
};

// 关闭连接
eventSource.close();`}</code></pre>
            </div>

            {/* QQ Bot 集成 */}
            <div class="docs-section" id="qqbot-integration">
              <h2>🤖 QQ Bot Webhook 集成</h2>
              
              <p>Webhook Proxy 支持 QQ 官方机器人的 Webhook 事件转发，使用 <strong>Ed25519</strong> 数字签名算法进行身份验证。</p>

              <h3>1. 获取 QQ Bot 凭据</h3>
              <p>访问 <a href="https://q.qq.com/#/app/bot" target="_blank" rel="noopener">QQ 开放平台</a> 并完成以下步骤：</p>
              <ul>
                <li>创建或选择一个机器人</li>
                <li>在 <strong>开发设置</strong> 中获取：
                  <ul>
                    <li><strong>App ID</strong>：机器人的唯一标识</li>
                    <li><strong>App Secret</strong>：用于 Ed25519 签名的密钥</li>
                  </ul>
                </li>
              </ul>

              <div class="warning">
                <strong>⚠️ 重要提示：</strong><br/>
                App Secret 是敏感信息，请妥善保管！不要将其泄露或提交到代码仓库。如果 Secret 泄露，请立即在 QQ 开放平台重置。
              </div>

              <h3>2. 创建 QQ Bot Proxy</h3>
              <p>在 Dashboard 创建 Proxy 时：</p>
              <ul>
                <li><strong>平台</strong>：选择 <span class="inline-code">QQ Bot</span></li>
                <li><strong>App ID</strong>：填入机器人的 App ID</li>
                <li><strong>Webhook Secret</strong>：填入 App Secret（<strong>不是公钥</strong>）</li>
                <li><strong>签名验证</strong>：建议启用（生产环境必须启用）</li>
              </ul>

              <pre><code class="language-bash">{`POST /api/proxies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My QQ Bot",
  "platform": "qqbot",
  "platform_app_id": "102005927",
  "webhook_secret": "your_app_secret_here",
  "verify_signature": true
}`}</code></pre>

              <h3>3. 配置 QQ 开放平台</h3>
              <p>在 QQ 机器人管理页面：</p>
              <ol>
                <li>进入 <strong>事件订阅</strong> → <strong>Webhook 方式</strong></li>
                <li>填写回调地址：从 Dashboard 复制的 Webhook URL</li>
                <li>QQ 平台会发送 OpCode 13 验证请求，系统会自动响应</li>
                <li>验证成功后，选择需要订阅的事件</li>
                <li>保存配置</li>
              </ol>

              <div class="success">
                <strong>✅ 验证流程自动完成！</strong><br/>
                Webhook Proxy 会自动处理 OpCode 13 回调验证，无需手动操作。
              </div>

              <h3>4. 支持的事件类型</h3>
              <p>Webhook Proxy 支持所有 QQ Bot 事件类型（OpCode 0 - Dispatch）：</p>

              <p><strong>公域事件：</strong></p>
              <ul>
                <li><span class="inline-code">AT_MESSAGE_CREATE</span> - 用户 @ 机器人</li>
                <li><span class="inline-code">PUBLIC_MESSAGE_DELETE</span> - 频道消息删除</li>
              </ul>

              <p><strong>私域事件（需要权限）：</strong></p>
              <ul>
                <li><span class="inline-code">MESSAGE_CREATE</span> - 频道消息</li>
                <li><span class="inline-code">MESSAGE_DELETE</span> - 消息删除</li>
                <li><span class="inline-code">MESSAGE_REACTION_ADD</span> / <span class="inline-code">MESSAGE_REACTION_REMOVE</span> - 表情反应</li>
              </ul>

              <p><strong>群聊和私聊：</strong></p>
              <ul>
                <li><span class="inline-code">C2C_MESSAGE_CREATE</span> - 用户单聊消息</li>
                <li><span class="inline-code">FRIEND_ADD</span> / <span class="inline-code">FRIEND_DEL</span> - 好友管理</li>
                <li><span class="inline-code">GROUP_AT_MESSAGE_CREATE</span> - 群聊 @ 机器人</li>
                <li><span class="inline-code">GROUP_ADD_ROBOT</span> / <span class="inline-code">GROUP_DEL_ROBOT</span> - 群机器人管理</li>
              </ul>

              <p><strong>其他事件：</strong></p>
              <ul>
                <li>频道、子频道、成员、互动、音频事件等</li>
              </ul>

              <div class="info">
                <strong>📚 完整事件列表：</strong><br/>
                访问 <a href="https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html" target="_blank" rel="noopener">QQ Bot 事件文档</a> 查看所有支持的事件类型。
              </div>

              <h3>5. 接收 QQ Bot 事件</h3>
              <p><strong>WebSocket 方式：</strong></p>
              <pre><code class="language-javascript">{`const ws = new WebSocket('wss://your-domain.com/qqbot/xxxxx/ws?token=your_access_token');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('QQ Bot 事件:', data);
  
  // 事件结构：
  // {
  //   id: '事件ID',
  //   platform: 'qqbot',
  //   type: 'AT_MESSAGE_CREATE',  // 事件类型
  //   timestamp: 1234567890,
  //   headers: { ... },
  //   payload: { ... },  // 原始 QQ Bot 数据
  //   data: {
  //     opcode: 0,
  //     event_type: 'AT_MESSAGE_CREATE',
  //     sequence: 42,
  //     event_data: { ... }
  //   }
  // }
};`}</code></pre>

              <p><strong>SSE 方式：</strong></p>
              <pre><code class="language-javascript">{`const es = new EventSource('https://your-domain.com/qqbot/xxxxx/sse?token=your_access_token');

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // 根据事件类型处理
  if (data.type === 'AT_MESSAGE_CREATE') {
    console.log('收到 @ 消息:', data.data.event_data);
  }
  
  if (data.type === 'GROUP_AT_MESSAGE_CREATE') {
    console.log('收到群聊 @ 消息:', data.data.event_data);
  }
};`}</code></pre>

              <h3>6. Ed25519 签名验证</h3>
              <p>QQ Bot 使用 Ed25519 数字签名算法：</p>
              <ul>
                <li><strong>OpCode 13</strong>（回调验证）：Webhook Proxy 使用 App Secret 签名响应</li>
                <li><strong>OpCode 0</strong>（事件推送）：Webhook Proxy 验证 QQ 平台的签名</li>
              </ul>
              
              <p>验证流程：</p>
              <pre><code class="language-bash">{`// QQ 平台发送请求时携带：
X-Signature-Timestamp: 时间戳
X-Signature-Ed25519: 签名（hex 编码）

// Webhook Proxy 验证签名：
message = timestamp + body
verify(message, signature, publicKey)

// 签名验证通过后，转发事件`}</code></pre>

              <div class="success">
                <strong>✅ 自动验证：</strong><br/>
                所有签名验证流程由 Webhook Proxy 自动完成，你只需要正确配置 App Secret。
              </div>

              <h3>7. 故障排查</h3>
              <p><strong>回调地址验证失败：</strong></p>
              <ul>
                <li>检查 App Secret 是否配置正确</li>
                <li>确保 Webhook URL 可以从公网访问</li>
                <li>使用允许的端口（80、443、8080、8443）</li>
              </ul>

              <p><strong>收不到事件：</strong></p>
              <ul>
                <li>在 QQ 开放平台检查事件订阅配置</li>
                <li>检查日志确认签名验证状态（<span class="inline-code">wrangler tail</span>）</li>
                <li>实现 WebSocket 重连机制</li>
              </ul>

              <p><strong>签名验证失败：</strong></p>
              <ul>
                <li>确认 App Secret 配置正确（不是公钥）</li>
                <li>检查服务器时间是否同步</li>
                <li>查看详细日志：<span class="inline-code">npx wrangler tail --format pretty</span></li>
              </ul>

              <div class="info">
                <strong>💡 获取更多帮助：</strong><br/>
                - <a href="https://github.com/lc-cn/webhook-proxy/blob/master/QQBOT_GUIDE.md" target="_blank">QQ Bot 集成详细指南</a><br/>
                - <a href="https://bot.q.qq.com/wiki/" target="_blank">QQ Bot 官方文档</a><br/>
                - <a href="https://github.com/lc-cn/webhook-proxy/issues" target="_blank">提交 Issue</a>
              </div>
            </div>

            {/* Telegram Bot 集成 */}
            <div class="docs-section" id="telegram-integration">
              <h2>✈️ Telegram Bot Webhook 集成</h2>
              
              <p>Webhook Proxy 支持 Telegram 机器人的 Webhook 事件转发，使用简单的 <strong>Secret Token</strong> 进行身份验证。</p>

              <h3>1. 创建 Telegram Bot</h3>
              <p>通过 BotFather 创建 Telegram Bot：</p>
              <ol>
                <li>在 Telegram 中搜索 <a href="https://t.me/BotFather" target="_blank" rel="noopener">@BotFather</a></li>
                <li>发送命令 <span class="inline-code">/newbot</span></li>
                <li>按提示设置机器人名称和用户名</li>
                <li>BotFather 会返回 <strong>Bot Token</strong>（格式：<span class="inline-code">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</span>）</li>
                <li>妥善保管 Bot Token，不要泄露给他人</li>
              </ol>

              <div class="warning">
                <strong>⚠️ 安全提示：</strong><br/>
                Bot Token 是敏感信息，拥有它的人可以完全控制你的机器人。请勿将其泄露或提交到代码仓库。
              </div>

              <h3>2. 创建 Telegram Bot Proxy</h3>
              <p>在 Dashboard 创建 Proxy 时：</p>
              <ul>
                <li><strong>平台</strong>：选择 <span class="inline-code">Telegram</span></li>
                <li><strong>Bot Token</strong>：填入从 BotFather 获取的 Token</li>
                <li><strong>Secret Token</strong>：可选，填写自定义的安全令牌（推荐）</li>
                <li><strong>签名验证</strong>：建议启用</li>
              </ul>

              <pre><code class="language-bash">{`POST /api/proxies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Telegram Bot",
  "platform": "telegram",
  "platform_app_id": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "webhook_secret": "my-custom-secret-token",
  "verify_signature": true
}`}</code></pre>

              <h3>3. 设置 Webhook URL</h3>
              <p>使用 Telegram Bot API 设置 Webhook URL：</p>

              <pre><code class="language-bash">{`# 使用 curl 设置 Webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/telegram/xxxxx",
    "secret_token": "your-secret-token-if-enabled"
  }'

# 验证 Webhook 设置
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"`}</code></pre>

              <div class="info">
                <strong>💡 提示：</strong><br/>
                - 将 <span class="inline-code">&lt;YOUR_BOT_TOKEN&gt;</span> 替换为你的 Bot Token<br/>
                - 将 <span class="inline-code">xxxxx</span> 替换为 Dashboard 中生成的 random key<br/>
                - <span class="inline-code">secret_token</span> 必须与创建 Proxy 时设置的一致
              </div>

              <h3>4. 支持的更新类型</h3>
              <p>Telegram Bot 支持多种更新类型：</p>

              <p><strong>消息类型：</strong></p>
              <ul>
                <li><span class="inline-code">message</span> - 新消息（文本、图片、视频等）</li>
                <li><span class="inline-code">edited_message</span> - 编辑的消息</li>
                <li><span class="inline-code">channel_post</span> - 频道消息</li>
                <li><span class="inline-code">edited_channel_post</span> - 编辑的频道消息</li>
              </ul>

              <p><strong>交互类型：</strong></p>
              <ul>
                <li><span class="inline-code">callback_query</span> - 内联键盘按钮回调</li>
                <li><span class="inline-code">inline_query</span> - 内联查询</li>
                <li><span class="inline-code">chosen_inline_result</span> - 选中的内联结果</li>
              </ul>

              <p><strong>支付和其他：</strong></p>
              <ul>
                <li><span class="inline-code">shipping_query</span> - 配送查询</li>
                <li><span class="inline-code">pre_checkout_query</span> - 预结账查询</li>
                <li><span class="inline-code">poll</span> / <span class="inline-code">poll_answer</span> - 投票</li>
                <li><span class="inline-code">my_chat_member</span> / <span class="inline-code">chat_member</span> - 成员状态变更</li>
                <li><span class="inline-code">chat_join_request</span> - 入群请求</li>
              </ul>

              <div class="info">
                <strong>📚 完整文档：</strong><br/>
                访问 <a href="https://core.telegram.org/bots/api#update" target="_blank" rel="noopener">Telegram Bot API 文档</a> 查看所有更新类型。
              </div>

              <h3>5. 接收 Telegram 事件</h3>
              <p><strong>WebSocket 方式：</strong></p>
              <pre><code class="language-javascript">{`const ws = new WebSocket('wss://your-domain.com/telegram/xxxxx/ws?token=your_access_token');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Telegram 事件:', data);
  
  // 事件结构：
  // {
  //   id: '事件ID',
  //   platform: 'telegram',
  //   type: 'message',  // 更新类型
  //   timestamp: 1234567890,
  //   headers: { ... },
  //   payload: { ... },  // 原始 Telegram Update
  //   data: {
  //     update_id: 123456789,
  //     event_type: 'message',
  //     chat_id: 123456789,
  //     user_id: 987654321,
  //     message_text: 'Hello, Bot!'
  //   }
  // }
  
  // 处理不同类型的消息
  if (data.type === 'message' && data.payload.message) {
    const msg = data.payload.message;
    console.log('消息文本:', msg.text);
    console.log('发送者:', msg.from.username);
  }
};`}</code></pre>

              <p><strong>SSE 方式：</strong></p>
              <pre><code class="language-javascript">{`const es = new EventSource('https://your-domain.com/telegram/xxxxx/sse?token=your_access_token');

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // 根据事件类型处理
  switch (data.type) {
    case 'message':
      console.log('新消息:', data.data.message_text);
      break;
    case 'callback_query':
      console.log('按钮回调:', data.payload.callback_query.data);
      break;
    case 'inline_query':
      console.log('内联查询:', data.payload.inline_query.query);
      break;
  }
};`}</code></pre>

              <h3>6. Secret Token 验证</h3>
              <p>Secret Token 提供额外的安全保护：</p>
              <ul>
                <li>Telegram 在每次请求时发送 <span class="inline-code">X-Telegram-Bot-Api-Secret-Token</span> 头</li>
                <li>Webhook Proxy 验证该 Token 是否与配置的 Secret Token 匹配</li>
                <li>验证失败返回 <span class="inline-code">401 Unauthorized</span></li>
                <li>Secret Token 长度应为 1-256 个字符</li>
              </ul>

              <pre><code class="language-bash">{`// Telegram 请求头示例：
X-Telegram-Bot-Api-Secret-Token: my-custom-secret-token

// Webhook Proxy 验证流程：
if (secretToken !== configured_secret_token) {
  return 401 Unauthorized;
}`}</code></pre>

              <div class="success">
                <strong>✅ 最佳实践：</strong><br/>
                1. 始终使用 HTTPS（Telegram 要求）<br/>
                2. 设置 Secret Token 增强安全性<br/>
                3. 定期检查 Webhook 状态（使用 <span class="inline-code">getWebhookInfo</span>）<br/>
                4. 处理所有可能的更新类型
              </div>

              <h3>7. 常见问题</h3>
              <p><strong>Webhook 设置失败：</strong></p>
              <ul>
                <li>确保 URL 使用 HTTPS</li>
                <li>检查端口是否为 443、80、88 或 8443</li>
                <li>验证 SSL 证书是否有效</li>
                <li>确认 Bot Token 正确</li>
              </ul>

              <p><strong>收不到消息：</strong></p>
              <ul>
                <li>使用 <span class="inline-code">getWebhookInfo</span> 检查 Webhook 状态</li>
                <li>查看是否有待处理的更新（<span class="inline-code">pending_update_count</span>）</li>
                <li>检查 Secret Token 是否匹配</li>
                <li>查看 Cloudflare Workers 日志</li>
              </ul>

              <p><strong>删除 Webhook：</strong></p>
              <pre><code class="language-bash">{`curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"`}</code></pre>

              <div class="info">
                <strong>💡 获取更多帮助：</strong><br/>
                - <a href="https://core.telegram.org/bots/api" target="_blank">Telegram Bot API 文档</a><br/>
                - <a href="https://core.telegram.org/bots/webhooks" target="_blank">Telegram Webhooks 指南</a><br/>
                - <a href="https://github.com/lc-cn/webhook-proxy/issues" target="_blank">提交 Issue</a>
              </div>
            </div>

            {/* API 参考 */}
            <div class="docs-section" id="api-reference">
              <h2>📖 API 参考</h2>
              
              <h3>认证相关</h3>
              <ul>
                <li><span class="inline-code">GET /auth/github</span> - GitHub OAuth 登录</li>
                <li><span class="inline-code">GET /auth/gitlab</span> - GitLab OAuth 登录</li>
                <li><span class="inline-code">GET /auth/logout</span> - 退出登录</li>
                <li><span class="inline-code">GET /api/me</span> - 获取当前用户信息</li>
              </ul>

              <h3>Proxy 管理</h3>
              <ul>
                <li><span class="inline-code">GET /api/proxies</span> - 列出所有 Proxies</li>
                <li><span class="inline-code">POST /api/proxies</span> - 创建 Proxy</li>
                <li><span class="inline-code">GET /api/proxies/:id</span> - 获取 Proxy 详情</li>
                <li><span class="inline-code">PUT /api/proxies/:id</span> - 更新 Proxy</li>
                <li><span class="inline-code">DELETE /api/proxies/:id</span> - 删除 Proxy</li>
              </ul>

              <h3>Webhook 端点</h3>
              <ul>
                <li><span class="inline-code">POST /:platform/:key</span> - 接收 Webhook</li>
                <li><span class="inline-code">GET /:platform/:key/ws</span> - WebSocket 连接</li>
                <li><span class="inline-code">GET /:platform/:key/sse</span> - SSE 连接</li>
              </ul>

              <h3>其他</h3>
              <ul>
                <li><span class="inline-code">GET /health</span> - 健康检查</li>
                <li><span class="inline-code">GET /</span> - 首页</li>
                <li><span class="inline-code">GET /about</span> - 关于页面</li>
                <li><span class="inline-code">GET /docs</span> - 文档页面</li>
              </ul>
            </div>

            {/* CI/CD 部署 */}
            <div class="docs-section" id="ci-cd">
              <h2>🔄 CI/CD 自动部署</h2>
              
              <p>项目已配置 GitHub Actions 自动部署到 Cloudflare Workers。</p>

              <h3>工作流</h3>
              <ul>
                <li><strong>CI</strong>: 每次 Push 和 PR 都会运行类型检查</li>
                <li><strong>Preview</strong>: PR 创建时运行预览部署验证</li>
                <li><strong>Deploy</strong>: 合并到 master 后自动部署到生产环境</li>
              </ul>

              <h3>配置步骤</h3>
              <p><strong>1. Fork 本仓库</strong></p>
              
              <p><strong>2. 配置 GitHub Secrets</strong></p>
              <p>在仓库的 Settings → Secrets and variables → Actions 中添加：</p>
              <ul>
                <li><span class="inline-code">CLOUDFLARE_API_TOKEN</span> - Cloudflare API Token</li>
                <li><span class="inline-code">CLOUDFLARE_ACCOUNT_ID</span> - Cloudflare Account ID</li>
              </ul>

              <div class="info">
                <strong>获取 API Token：</strong><br/>
                访问 Cloudflare Dashboard → API Tokens → Create Token<br/>
                使用 "Edit Cloudflare Workers" 模板
              </div>

              <div class="info">
                <strong>获取 Account ID：</strong><br/>
                访问 Cloudflare Dashboard，在右侧边栏找到 Account ID
              </div>

              <p><strong>3. 推送代码自动部署</strong></p>
              <pre><code class="language-bash">{`git push origin master`}</code></pre>

              <p>GitHub Actions 会自动：</p>
              <ul>
                <li>✅ 类型检查</li>
                <li>✅ 应用数据库迁移</li>
                <li>✅ 部署到 Cloudflare Workers</li>
              </ul>

              <h3>查看部署状态</h3>
              <p>访问仓库的 Actions 页面查看工作流运行状态。</p>

              <div class="success">
                <strong>💡 提示：</strong><br/>
                详细配置说明请查看 <a href="https://github.com/lc-cn/webhook-proxy/blob/master/.github/CI_CD_SETUP.md" target="_blank">.github/CI_CD_SETUP.md</a>
              </div>
            </div>

            {/* 部署指南 */}
            <div class="docs-section" id="deployment">
              <h2>🚀 手动部署指南</h2>
              
              <h3>环境要求</h3>
              <ul>
                <li>Node.js 18+</li>
                <li>Cloudflare 账号（免费）</li>
                <li>Wrangler CLI</li>
              </ul>

              <h3>本地开发</h3>
              <pre><code class="language-bash">{`# 安装依赖
npm install

# 配置环境变量
cp .dev.vars.example .dev.vars

# 创建本地数据库
npm run db:migrate:local

# 启动开发服务器
npm run dev`}</code></pre>

              <h3>部署到 Cloudflare</h3>
              <pre><code class="language-bash">{`# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npm run db:create

# 运行数据库迁移
npm run db:migrate

# 配置环境变量
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put GITLAB_CLIENT_ID
npx wrangler secret put GITLAB_CLIENT_SECRET
npx wrangler secret put SESSION_SECRET
npx wrangler secret put JWT_SECRET
npx wrangler secret put RESEND_API_KEY

# 部署
npm run deploy`}</code></pre>

              <div class="success">
                <strong>✅ 部署完成！</strong><br/>
                你的服务已经在 Cloudflare Workers 上运行，完全免费！
              </div>

              <h3>环境变量说明</h3>
              <ul>
                <li><strong>GITHUB_CLIENT_ID</strong> / <strong>GITHUB_CLIENT_SECRET</strong> - GitHub OAuth 应用凭据</li>
                <li><strong>GITLAB_CLIENT_ID</strong> / <strong>GITLAB_CLIENT_SECRET</strong> - GitLab OAuth 应用凭据</li>
                <li><strong>SESSION_SECRET</strong> - Session 加密密钥（至少 32 字符）</li>
                <li><strong>JWT_SECRET</strong> - JWT 签名密钥（至少 32 字符）</li>
                <li><strong>RESEND_API_KEY</strong> - Resend 邮件服务 API Key（格式：re_xxx）<br/>
                  <small>获取方式：访问 <a href="https://resend.com" target="_blank" rel="noopener">resend.com</a> 注册并创建 API Key</small>
                </li>
              </ul>

              <div class="info">
                <strong>💡 提示：</strong>生成随机密钥可以使用：<br/>
                <span class="inline-code">node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"</span>
              </div>
            </div>

            {/* 底部导航 */}
            <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
              <a href="/dashboard" class="btn">开始使用</a>
              <a href="/about" class="btn btn-secondary">关于项目</a>
              <a href="/" class="btn btn-secondary">返回首页</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

