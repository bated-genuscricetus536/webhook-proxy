import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types/index.js';
import { loggerMiddleware } from './middleware/logger.js';
import authRoutes from './routes/auth.js';
import accountRoutes from './routes/account.js';
import accountSettingsRoutes from './routes/account-settings.js';
import apiRoutes from './routes/api.js';
import webhookRoutes from './routes/webhook.js';
import dashboardRoutes from './routes/dashboard.js';
import securityRoutes from './routes/security.js';
import passwordResetRoutes from './routes/password-reset.js';
import { WebhookConnection } from './durable-objects/webhook-connection.js';
import { Home } from './pages/Home.js';
import { About } from './pages/About.js';
import { Docs } from './pages/Docs.js';
import { Settings } from './pages/Settings.js';
import { ResetPassword } from './pages/ResetPassword.js';

// 导出 Durable Object
export { WebhookConnection };

// 创建主应用
// @ts-ignore
const app = new Hono<Env>();

// 全局中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', loggerMiddleware);

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// 首页
app.get('/', (c) => {
  return c.html(Home({}));
});

// 关于页面
app.get('/about', (c) => {
  return c.html(About({}));
});

// 文档页面
app.get('/docs', (c) => {
  return c.html(Docs({}));
});

// 设置页面
app.get('/settings', (c) => {
  return c.html(Settings());
});

// 密码重置页面
app.get('/reset-password', (c) => {
  return c.html(ResetPassword());
});

// 路由注册顺序：先注册更具体的路径，后注册通配符路径
// 1. Auth 路由（包括密码重置）
app.route('/auth', authRoutes as any);
app.route('/api/auth', passwordResetRoutes as any);

// 2. Security 路由必须在 /api 之前注册，因为 /api 有全局认证中间件
// passkey/login/* 路由不需要认证（用于未登录用户的登录）
app.route('/api/security', securityRoutes as any);

// 3. Account 路由
app.route('/api/account', accountRoutes as any);
app.route('/api/account/settings', accountSettingsRoutes as any);

// 4. 通用 API 路由（带全局认证中间件）
app.route('/api', apiRoutes as any);

// 5. Dashboard 路由
app.route('/dashboard', dashboardRoutes as any);

// 6. Webhook 路由（通配符路由，需要放在最后）
// 路由模式: /:platform/:randomKey (会匹配所有两段路径)
app.route('/', webhookRoutes as any);

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('[Error]', err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 导出默认处理器（Cloudflare Workers 格式）
export default app;
