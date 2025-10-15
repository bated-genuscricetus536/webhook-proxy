import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { Dashboard } from '../pages/Dashboard.js';

// @ts-ignore
const dashboard = new Hono<Env>();

// Dashboard 页面
dashboard.get('/', (c) => {
  return c.html(Dashboard({}));
});

export default dashboard;
