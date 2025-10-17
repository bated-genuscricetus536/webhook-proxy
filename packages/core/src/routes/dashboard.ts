import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { Dashboard } from '../pages/Dashboard.js';

// @ts-ignore
const dashboard = new Hono<Env>();

// Dashboard 页面
dashboard.get('/', (c) => {
  // 获取查询参数
  const passkeyLogin = c.req.query('passkey_login');
  const cliRedirect = c.req.query('cli_redirect');
  
  return c.html(Dashboard({
    passkeyLogin: passkeyLogin === 'true',
    cliRedirect: cliRedirect || null,
  }));
});

export default dashboard;
