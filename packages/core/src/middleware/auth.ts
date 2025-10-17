import { Context, Next } from 'hono';
import { Env } from '../types/index.js';
import { verifySessionToken } from '../auth/oauth.js';

/**
 * 认证中间件
 * 验证用户是否已登录，并将 userId 存储到 context
 */
// @ts-ignore - Hono type compatibility
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: { userId: string } }>, next: Next) {
  // @ts-ignore
  const userId = await authenticate(c);
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // 存储到 context variables
  c.set('userId', userId);
  
  await next();
}

/**
 * 可选的认证中间件
 * 如果有 token 就验证，没有也允许通过
 */
// @ts-ignore - Hono type compatibility
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env; Variables: { userId?: string } }>, next: Next) {
  // @ts-ignore
  const userId = await authenticate(c);
  
  if (userId) {
    c.set('userId', userId);
  }
  
  await next();
}

/**
 * 从请求中提取并验证 token
 */
// @ts-ignore - Hono type compatibility
async function authenticate(c: Context<{ Bindings: Env }>): Promise<string | null> {
  const env = c.env;
  
  // 从 Cookie 获取 session
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.session) {
      const userId = await verifySessionToken(cookies.session, env.SESSION_SECRET);
      if (userId) {
        return userId;
      }
    }
  }
  
  // 从 Authorization header 获取 token
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userId = await verifySessionToken(token, env.SESSION_SECRET);
    if (userId) {
      return userId;
    }
  }
  
  return null;
}
