import { FC } from 'hono/jsx';
import { Layout } from '../components/Layout';

export const About: FC<{}> = (_props) => {
  return (
    <Layout title="关于 - Webhook Proxy">
      <div class="container" style="max-width: 800px;">
        <div class="badge">ℹ️ 关于项目</div>
        <h1>📖 关于 Webhook Proxy</h1>
        <p>一个开源的 Webhook 代理服务，帮助你将各种平台的 Webhook 事件转换为实时的 WebSocket 或 SSE 事件流。</p>
        
        <div class="features" style="border-top: 2px solid #e2e8f0; padding-top: 30px; margin-top: 30px;">
          <h2>🎯 项目目标</h2>
          <p style="color: #64748b; line-height: 1.8; margin-bottom: 20px;">
            许多开发者在接收 GitHub、GitLab 等平台的 Webhook 时，需要一个公网可访问的服务器。
            Webhook Proxy 提供了一个简单的解决方案，让你可以在本地开发环境实时接收这些事件。
          </p>

          <h2 style="margin-top: 30px;">✨ 核心特性</h2>
          <ul style="margin-bottom: 20px;">
            <li><strong>多平台支持</strong> - GitHub 和 GitLab Webhook</li>
            <li><strong>实时推送</strong> - WebSocket 和 SSE 两种方式</li>
            <li><strong>安全验证</strong> - 支持 Webhook 签名验证</li>
            <li><strong>易于部署</strong> - 基于 Cloudflare Workers，完全免费</li>
            <li><strong>用户管理</strong> - OAuth 登录，独立的 Proxy 管理</li>
            <li><strong>现代架构</strong> - Hono 框架，TypeScript，JSX 组件</li>
          </ul>

          <h2 style="margin-top: 30px;">🏗️ 技术栈</h2>
          <ul style="margin-bottom: 20px;">
            <li><strong>框架</strong> - Hono (轻量级 Web 框架)</li>
            <li><strong>运行时</strong> - Cloudflare Workers</li>
            <li><strong>数据库</strong> - Cloudflare D1 (SQLite)</li>
            <li><strong>缓存</strong> - Cloudflare KV</li>
            <li><strong>实时连接</strong> - Durable Objects</li>
            <li><strong>语言</strong> - TypeScript + JSX</li>
          </ul>

          <h2 style="margin-top: 30px;">🚀 使用场景</h2>
          <ul style="margin-bottom: 20px;">
            <li>本地开发时接收 Webhook 事件</li>
            <li>CI/CD 流水线状态监控</li>
            <li>代码审查和合并请求通知</li>
            <li>自动化测试触发</li>
            <li>项目协作实时通知</li>
          </ul>

          <h2 style="margin-top: 30px;">📝 开源协议</h2>
          <p style="color: #64748b; line-height: 1.8; margin-bottom: 20px;">
            本项目采用 <strong>MIT License</strong>，完全开源免费。
            欢迎贡献代码、提出问题或建议。
          </p>

          {/* GitHub Star 引导 */}
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; margin-top: 40px; color: white; text-align: center;">
            <h2 style="margin: 0 0 15px 0; font-size: 1.8em; color: white;">⭐ 喜欢这个项目？</h2>
            <p style="margin: 0 0 20px 0; font-size: 1.1em; opacity: 0.95;">
              在 GitHub 上给我们一个 Star，这是对开发者最大的鼓励！
            </p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
              <a 
                href="https://github.com/lc-cn/webhook-proxy" 
                target="_blank" 
                rel="noopener"
                style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: white; color: #667eea; border-radius: 25px; text-decoration: none; font-weight: 700; font-size: 1.1em; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s;"
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)'"
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                ⭐ Star on GitHub
              </a>
              <a 
                href="https://www.npmjs.com/package/webhook-proxy-cli" 
                target="_blank" 
                rel="noopener"
                style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; background: rgba(255,255,255,0.2); color: white; border: 2px solid white; border-radius: 25px; text-decoration: none; font-weight: 700; font-size: 1.1em; transition: all 0.3s;"
                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                onmouseout="this.style.background='rgba(255,255,255,0.2)'"
              >
                💻 CLI 工具
              </a>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.9em; opacity: 0.9;">
              <p style="margin: 0;">
                🐛 <a href="https://github.com/lc-cn/webhook-proxy/issues" target="_blank" rel="noopener" style="color: white; text-decoration: underline;">报告 Bug</a> · 
                💡 <a href="https://github.com/lc-cn/webhook-proxy/issues/new?labels=enhancement" target="_blank" rel="noopener" style="color: white; text-decoration: underline;">功能建议</a> · 
                🤝 <a href="https://github.com/lc-cn/webhook-proxy/pulls" target="_blank" rel="noopener" style="color: white; text-decoration: underline;">贡献代码</a>
              </p>
            </div>
          </div>

          <h2 style="margin-top: 40px;">🔗 快速链接</h2>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
            <button onclick="location.href='/docs'" style="flex: 1; min-width: 200px; background: #10b981;">
              📚 使用文档
            </button>
            <button onclick="window.open('https://github.com/lc-cn/webhook-proxy#readme', '_blank')" style="flex: 1; min-width: 200px; background: #3b82f6;">
              📖 README
            </button>
          </div>

          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px;">
            <button onclick="location.href='/dashboard'" style="flex: 1; min-width: 200px; background: #667eea;">
              🚀 开始使用
            </button>
            <button onclick="location.href='/'" style="flex: 1; min-width: 200px; background: #64748b;">
              🏠 返回首页
            </button>
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 0.9em;">
          <p>Made with ❤️ using Hono and Cloudflare Workers</p>
          <p style="margin-top: 10px;">© 2024 Webhook Proxy. All rights reserved.</p>
        </div>
      </div>
    </Layout>
  );
};

