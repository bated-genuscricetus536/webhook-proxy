import { Hono } from 'hono';
import { Env, CreateProxyRequest, UpdateProxyRequest } from '../types/index.js';
import { getProxiesByUserId, getProxyById, createProxy, updateProxy, deleteProxy } from '../db/proxies.js';
import { getUserById } from '../db/users.js';
import { authMiddleware } from '../middleware/auth.js';

// @ts-ignore
const api = new Hono<Env>();

// 应用认证中间件到所有 API 路由
api.use('/*', authMiddleware as any);

/**
 * 获取当前用户信息
 */
api.get('/me', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('[API] Get current user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 列出所有 Proxies
 */
api.get('/proxies', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const proxies = await getProxiesByUserId((c.env as any).DB, userId);
    
    const url = new URL(c.req.url);
    const origin = url.origin;
    
    // 获取用户信息，检查是否启用了 MFA/Passkey
    const user = await (await import('../db/users.js')).getUserById(
      (c.env as any).DB,
      userId
    );
    const requireAuth = user && (user.mfa_enabled || user.passkey_enabled);

    // 导入掩码函数
    const { maskSecret } = await import('../utils/mask.js');

    // 返回 proxies（如果启用了 MFA/Passkey，则返回掩码版本）
    const sanitizedProxies = proxies.map(proxy => {
      // 根据是否需要认证决定使用原始还是掩码版本的 access_token
      const displayToken = requireAuth ? maskSecret(proxy.access_token) : proxy.access_token;
      
      return {
        id: proxy.id,
        name: proxy.name,
        platform: proxy.platform,
        random_key: proxy.random_key,
        verify_signature: proxy.verify_signature,
        active: proxy.active,
        created_at: proxy.created_at,
        updated_at: proxy.updated_at,
        last_event_at: proxy.last_event_at,
        event_count: proxy.event_count,
        access_token: displayToken,
        webhook_secret: requireAuth ? maskSecret(proxy.webhook_secret) : proxy.webhook_secret,
        has_access_token: !!proxy.access_token,
        has_webhook_secret: !!proxy.webhook_secret,
        secrets_hidden: requireAuth,
        webhook_url: `${origin}/${proxy.platform}/${proxy.random_key}`,
        websocket_url: `${origin.replace('https://', 'wss://').replace('http://', 'ws://')}/${proxy.platform}/${proxy.random_key}/ws${proxy.access_token ? `?token=${displayToken}` : ''}`,
        sse_url: `${origin}/${proxy.platform}/${proxy.random_key}/sse${proxy.access_token ? `?token=${displayToken}` : ''}`,
      };
    });

    return c.json({ proxies: sanitizedProxies });
  } catch (error) {
    console.error('[API] List proxies error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 创建新 Proxy
 */
api.post('/proxies', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const body = await c.req.json<CreateProxyRequest>();
    
    // 验证输入
    if (!body.name || !body.platform) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['github', 'gitlab', 'qqbot', 'telegram', 'stripe', 'generic'].includes(body.platform)) {
      return c.json({ error: 'Invalid platform' }, 400);
    }

    const proxy = await createProxy((c.env as any).DB, userId, body);

    const url = new URL(c.req.url);
    const origin = url.origin;
    
    // 获取用户信息，检查是否启用了 MFA/Passkey
    const user = await (await import('../db/users.js')).getUserById(
      (c.env as any).DB,
      userId
    );
    const requireAuth = user && (user.mfa_enabled || user.passkey_enabled);

    // 导入掩码函数
    const { maskSecret } = await import('../utils/mask.js');

    // 根据是否需要认证决定使用原始还是掩码版本的 access_token
    const displayToken = requireAuth ? maskSecret(proxy.access_token) : proxy.access_token;

    return c.json({
      proxy: {
        id: proxy.id,
        name: proxy.name,
        platform: proxy.platform,
        random_key: proxy.random_key,
        verify_signature: proxy.verify_signature,
        active: proxy.active,
        created_at: proxy.created_at,
        access_token: displayToken,
        webhook_secret: requireAuth ? maskSecret(proxy.webhook_secret) : proxy.webhook_secret,
        has_access_token: !!proxy.access_token,
        has_webhook_secret: !!proxy.webhook_secret,
        secrets_hidden: requireAuth,
        webhook_url: `${origin}/${proxy.platform}/${proxy.random_key}`,
        websocket_url: `${origin.replace('https://', 'wss://').replace('http://', 'ws://')}/${proxy.platform}/${proxy.random_key}/ws${proxy.access_token ? `?token=${displayToken}` : ''}`,
        sse_url: `${origin}/${proxy.platform}/${proxy.random_key}/sse${proxy.access_token ? `?token=${displayToken}` : ''}`,
      }
    }, 201);
  } catch (error) {
    console.error('[API] Create proxy error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 更新 Proxy
 */
api.put('/proxies/:id', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const proxyId = c.req.param('id');
    
    const proxy = await getProxyById((c.env as any).DB, proxyId);
    if (!proxy) {
      return c.json({ error: 'Proxy not found' }, 404);
    }

    if (proxy.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const body = await c.req.json<UpdateProxyRequest>();
    await updateProxy((c.env as any).DB, proxyId, body);

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('[API] Update proxy error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 删除 Proxy
 */
api.delete('/proxies/:id', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const proxyId = c.req.param('id');
    
    const proxy = await getProxyById((c.env as any).DB, proxyId);
    if (!proxy) {
      return c.json({ error: 'Proxy not found' }, 404);
    }

    if (proxy.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await deleteProxy((c.env as any).DB, proxyId);

    return c.json({ status: 'ok' });
  } catch (error) {
    console.error('[API] Delete proxy error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default api;

