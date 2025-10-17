import { Context, Next } from 'hono';

/**
 * 日志中间件
 */
export async function loggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  console.log(`[${new Date().toISOString()}] ${method} ${path}`);
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} ${duration}ms`);
}

