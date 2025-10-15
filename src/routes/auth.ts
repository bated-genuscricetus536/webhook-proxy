import { Hono, Context } from 'hono';
import { Env } from '../types/index.js';
import { createOAuthProvider, generateState, generateSessionToken, verifySessionToken } from '../auth/oauth.js';
import { createUser, getUserById } from '../db/users.js';

// @ts-ignore
const auth = new Hono<Env>();

/**
 * GitHub OAuth 登录
 */
auth.get('/github', async (c) => {
  try {
    const provider = createOAuthProvider('github', c.env as unknown as Env);
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/github/callback`;
    
    const state = generateState();
    
    // 存储 state 到 KV（5分钟过期）- 登录模式
    await (c.env as any).SESSIONS.put(`oauth_state:${state}`, JSON.stringify({
      platform: 'github',
      mode: 'login',
    }), { expirationTtl: 300 });
    
    const authUrl = provider.getAuthUrl(state, redirectUri);
    
    return c.redirect(authUrl, 302);
  } catch (error) {
    console.error('[Auth] OAuth login error:', error);
    return c.text('Authentication failed', 500);
  }
});

/**
 * GitLab OAuth 登录
 */
auth.get('/gitlab', async (c) => {
  try {
    const provider = createOAuthProvider('gitlab', c.env as unknown as Env);
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/gitlab/callback`;
    
    const state = generateState();
    
    // 存储 state 到 KV（5分钟过期）- 登录模式
    await (c.env as any).SESSIONS.put(`oauth_state:${state}`, JSON.stringify({
      platform: 'gitlab',
      mode: 'login',
    }), { expirationTtl: 300 });
    
    const authUrl = provider.getAuthUrl(state, redirectUri);
    
    return c.redirect(authUrl, 302);
  } catch (error) {
    console.error('[Auth] OAuth login error:', error);
    return c.text('Authentication failed', 500);
  }
});

/**
 * GitHub OAuth 回调
 */
auth.get('/github/callback', async (c) => {
  return handleOAuthCallback(c as any, 'github');
});

/**
 * GitLab OAuth 回调
 */
auth.get('/gitlab/callback', async (c) => {
  return handleOAuthCallback(c as any, 'gitlab');
});

/**
 * 登出
 */
auth.get('/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (cookies.session) {
      const userId = await verifySessionToken(cookies.session, (c.env as any).SESSION_SECRET);
      if (userId) {
        await (c.env as any).SESSIONS.delete(`session:${userId}`);
      }
    }
  }
  
  // 清除 cookie 并重定向到首页
  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'session=; Path=/; SameSite=Lax; Max-Age=0',
    },
  });
  return response;
});

/**
 * 处理 OAuth 回调的通用函数
 * 支持两种模式：
 * 1. 登录模式（未登录用户）：查找已绑定的账户或创建新账户
 * 2. 绑定模式（已登录用户）：将 OAuth 账号绑定到当前账户
 */
// @ts-ignore
async function handleOAuthCallback(c: Context<{ Bindings: Env }>, platform: 'github' | 'gitlab') {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    
    if (!code || !state) {
      return c.text('Invalid callback parameters', 400);
    }
    
    // 验证 state
    const storedData = await (c.env as any).SESSIONS.get(`oauth_state:${state}`);
    if (!storedData) {
      return c.text('Invalid or expired state', 400);
    }
    
    const { platform: storedPlatform, mode, userId } = JSON.parse(storedData);
    if (storedPlatform !== platform) {
      return c.text('Invalid state', 400);
    }
    
    // 删除已使用的 state
    await (c.env as any).SESSIONS.delete(`oauth_state:${state}`);
    
    // 获取 access token
    const provider = createOAuthProvider(platform, c.env as any);
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/${platform}/callback`;
    const accessToken = await provider.getAccessToken(code, redirectUri);
    
    // 获取用户信息
    const userInfo = await provider.getUserInfo(accessToken);
    
    // 导入 OAuth 绑定相关函数
    const { getBindingByPlatform, createBinding } = await import('../db/oauth-bindings.js');
    
    // 检查此 OAuth 账号是否已绑定
    const existingBinding = await getBindingByPlatform((c.env as any).DB, platform, userInfo.id);
    
    // 模式 1：登录模式（未登录）
    if (mode === 'login') {
      let user;
      
      if (existingBinding) {
        // OAuth 账号已绑定，登录到绑定的账户
        user = await getUserById((c.env as any).DB, existingBinding.user_id);
        if (!user) {
          return c.text('User not found', 404);
        }
        
        // 更新 OAuth binding 的 token
        const { updateBinding } = await import('../db/oauth-bindings.js');
        await updateBinding((c.env as any).DB, existingBinding.id, {
          access_token: accessToken,
          platform_username: userInfo.username,
        });
      } else {
        // OAuth 账号未绑定，创建新账户
        // 首先创建用户账户
        user = await createUser((c.env as any).DB, userInfo.username, userInfo.email, userInfo.avatar_url);
        
        // 然后创建 OAuth 绑定
        await createBinding(
          (c.env as any).DB,
          user.id,
          platform,
          userInfo.id,
          userInfo.username,
          accessToken
        );
      }
      
      // 生成 session token
      const sessionToken = await generateSessionToken(user.id, (c.env as any).SESSION_SECRET);
      
      // 存储 session 到 KV（30天）
      await (c.env as any).SESSIONS.put(`session:${user.id}`, sessionToken, {
        expirationTtl: 30 * 24 * 60 * 60,
      });
      
      // 重定向到 Dashboard
      const isProduction = url.hostname !== 'localhost' && !url.hostname.startsWith('127.0.0.1');
      const secureCookie = isProduction ? '; Secure' : '';
      
      const response = new Response(null, {
        status: 302,
        headers: {
          'Location': `/dashboard?token=${encodeURIComponent(sessionToken)}`,
          'Set-Cookie': `session=${sessionToken}; Path=/; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}${secureCookie}`,
        },
      });
      return response;
    }
    
    // 模式 2：绑定模式（已登录）
    if (mode === 'bind' && userId) {
      // 验证当前用户
      const currentUser = await getUserById((c.env as any).DB, userId);
      if (!currentUser) {
        return c.text('Unauthorized', 401);
      }
      
      if (existingBinding) {
        if (existingBinding.user_id === userId) {
          // 已经绑定到当前账户
          return c.html(`
            <html>
              <head><title>已绑定</title></head>
              <body>
                <script>
                  alert('此 ${platform} 账号已经绑定到当前账户');
                  window.location.href = '/settings';
                </script>
              </body>
            </html>
          `);
        } else {
          // 已经绑定到其他账户
          return c.html(`
            <html>
              <head><title>绑定失败</title></head>
              <body>
                <script>
                  alert('此 ${platform} 账号已经绑定到其他账户');
                  window.location.href = '/settings';
                </script>
              </body>
            </html>
          `);
        }
      }
      
      // 创建新的绑定
      await createBinding(
        (c.env as any).DB,
        userId,
        platform,
        userInfo.id,
        userInfo.username,
        accessToken
      );
      
      return c.html(`
        <html>
          <head><title>绑定成功</title></head>
          <body>
            <script>
              alert('${platform} 账号绑定成功！');
              window.location.href = '/settings';
            </script>
          </body>
        </html>
      `);
    }
    
    return c.text('Invalid mode', 400);
  } catch (error) {
    console.error(`[Auth] OAuth callback error:`, error);
    return c.text('Authentication failed', 500);
  }
}

export default auth;

