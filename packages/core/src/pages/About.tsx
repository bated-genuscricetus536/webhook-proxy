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

          <h2 style="margin-top: 30px;">🔗 相关链接</h2>
          <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 20px;">
            <button onclick="window.open('https://github.com', '_blank')" style="flex: 1; min-width: 200px;">
              📦 GitHub 仓库
            </button>
            <button onclick="location.href='/docs'" style="flex: 1; min-width: 200px; background: #10b981;">
              📚 使用文档
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

