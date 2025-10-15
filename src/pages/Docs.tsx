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
        <style>{docsStyle}</style>
      </head>
      <body>
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
            <a href="#webhook-usage">Webhook 使用</a>
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
              <div class="code-block">
                http://localhost:8787
              </div>
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
              <div class="code-block">
                {`// WebSocket 方式
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
};`}
              </div>
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
              <div class="code-block">
                {`POST /api/account/register
Content-Type: application/json

{
  "username": "your-username",
  "email": "your-email@example.com",
  "password": "your-secure-password"
}`}
              </div>

              <h3>账号绑定</h3>
              <p>登录后，可以在设置页面绑定多种登录方式：</p>
              <ul>
                <li>密码注册的用户可以绑定 GitHub/GitLab OAuth</li>
                <li>OAuth 登录的用户可以设置密码</li>
                <li>所有用户都可以注册 Passkey</li>
              </ul>

              <h3>Session 管理</h3>
              <p>登录后，系统会设置一个 Session Cookie：</p>
              <div class="code-block">
                {`Set-Cookie: session=<token>; Path=/; SameSite=Lax; Max-Age=2592000`}
              </div>
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
              <div class="code-block">
                {`POST /api/proxies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Project",
  "platform": "github",
  "webhook_secret": "optional-secret",
  "verify_signature": true
}`}
              </div>

              <h3>列出所有 Proxies</h3>
              <div class="code-block">
                {`GET /api/proxies
Authorization: Bearer <token>`}
              </div>

              <h3>更新 Proxy</h3>
              <div class="code-block">
                {`PUT /api/proxies/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "active": false
}`}
              </div>

              <h3>删除 Proxy</h3>
              <div class="code-block">
                {`DELETE /api/proxies/:id
Authorization: Bearer <token>`}
              </div>

              <div class="warning">
                <strong>⚠️ 注意：</strong>删除 Proxy 后，所有关联的 Webhook URL 将失效，且操作不可恢复。
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
              <div class="code-block">
                {`{
  "id": "github-1234567890-abcdef",
  "type": "push",
  "platform": "github",
  "timestamp": 1234567890000,
  "raw": { /* 原始 webhook 数据 */ },
  "headers": {
    "x-github-event": "push",
    "x-github-delivery": "..."
  }
}`}
              </div>

              <h3>WebSocket 连接示例</h3>
              <div class="code-block">
                {`const ws = new WebSocket('wss://your-worker.workers.dev/github/xxx/ws');

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
};`}
              </div>

              <h3>SSE 连接示例</h3>
              <div class="code-block">
                {`const eventSource = new EventSource(
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
eventSource.close();`}
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
              <div class="code-block">
                {`git push origin master`}
              </div>

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
              <div class="code-block">
                {`# 安装依赖
npm install

# 配置环境变量
cp .dev.vars.example .dev.vars

# 创建本地数据库
npm run db:migrate:local

# 启动开发服务器
npm run dev`}
              </div>

              <h3>部署到 Cloudflare</h3>
              <div class="code-block">
                {`# 登录 Cloudflare
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
npm run deploy`}
              </div>

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

