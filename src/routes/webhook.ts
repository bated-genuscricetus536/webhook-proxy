import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { getProxyByRandomKey, updateProxyEventCount } from '../db/proxies.js';
import { GitHubAdapter, GitLabAdapter } from '../adapters/index-cf.js';
import { createQQBotAdapter } from '../adapters/qqbot-cf.js';

// @ts-ignore
const webhook = new Hono<Env>();

/**
 * 处理 Webhook 请求
 * 路由: /:platform/:randomKey
 */
webhook.post('/:platform/:randomKey', async (c) => {
  try {
    const platform = c.req.param('platform') as 'github' | 'gitlab' | 'qqbot';
    const randomKey = c.req.param('randomKey');
    
    // 验证平台
    if (!['github', 'gitlab', 'qqbot'].includes(platform)) {
      return c.text('Invalid platform', 400);
    }
    
    // 查找 proxy 配置
    const proxy = await getProxyByRandomKey(c.env!.DB as D1Database, randomKey);
    
    if (!proxy) {
      return c.text('Proxy not found', 404);
    }

    if (!proxy.active) {
      return c.text('Proxy is inactive', 403);
    }

    if (proxy.platform !== platform) {
      return c.text('Platform mismatch', 400);
    }

    // QQ Bot 特殊处理
    if (platform === 'qqbot') {
      const qqbotAdapter = createQQBotAdapter({
        appId: proxy.platform_app_id || '',
        secret: proxy.webhook_secret || '', // QQ Bot uses webhook_secret as App Secret
        verifySignature: proxy.verify_signature,
      });
      
      const response = await qqbotAdapter.handleWebhook(c.req.raw);
      
      // 如果是正常事件（OpCode 0），则继续广播
      const body = await c.req.text();
      const payload = JSON.parse(body);
      
      if (payload.op === 0) {
        const event = qqbotAdapter.transform(payload);
        
        // 更新事件计数
        await updateProxyEventCount(c.env!.DB as D1Database, proxy.id);
        
        // 广播到 Durable Object
        const doId = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.idFromName(randomKey);
        const doStub = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.get(doId);
        
        await doStub.fetch(new Request(`https://do/broadcast`, {
          method: 'POST',
          body: JSON.stringify(event),
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      
      return response;
    }

    // 解析请求体
    const body = await c.req.json();

    // 创建适配器
    let adapter;
    if (platform === 'github') {
      adapter = new GitHubAdapter({
        platform,
        verifySignature: proxy.verify_signature,
        secret: proxy.webhook_secret || undefined,
      });
    } else {
      adapter = new GitLabAdapter({
        platform,
        verifySignature: proxy.verify_signature,
        secret: proxy.webhook_secret || undefined,
      });
    }

    // 验证签名
    const request = c.req.raw;
    if (!(await adapter.verifySignature(request, body))) {
      console.error(`[Webhook] Signature verification failed for ${randomKey}`);
      return c.text('Invalid signature', 401);
    }

    // 解析事件
    const event = adapter.parse(request, body);
    if (!event) {
      return c.text('Failed to parse event', 400);
    }

    console.log(`[Webhook] Received event: ${platform}/${event.type} for ${randomKey}`);

    // 更新事件计数
    await updateProxyEventCount(c.env!.DB as D1Database, proxy.id);

    // 广播到 Durable Object
    const doId = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.idFromName(randomKey);
    const doStub = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.get(doId);
    
    await doStub.fetch(new Request(`https://do/broadcast`, {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json' },
    }));

    return c.json({ status: 'ok', eventId: event.id });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return c.text('Internal server error', 500);
  }
});

/**
 * 处理 WebSocket 连接
 * 路由: /:platform/:randomKey/ws
 */
webhook.get('/:platform/:randomKey/ws', async (c) => {
  try {
    const randomKey = c.req.param('randomKey');
    const token = c.req.query('token');
    
    // 验证 proxy 存在
    const proxy = await getProxyByRandomKey(c.env!.DB as D1Database, randomKey);
    
    if (!proxy) {
      return c.text('Proxy not found', 404);
    }

    if (!proxy.active) {
      return c.text('Proxy is inactive', 403);
    }

    // 验证 access token
    if (proxy.access_token && proxy.access_token !== token) {
      return c.text('Invalid access token', 401);
    }

    // 转发到 Durable Object
    const doId = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.idFromName(randomKey);
    const doStub = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.get(doId);
    
    // 创建新的 Request 和 Headers，保留所有必要信息
    const request = c.req.raw;
    const newHeaders = new Headers(request.headers);
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      // @ts-ignore - duplex 是 WebSocket 需要的
      duplex: 'half',
    });
    
    const response = await doStub.fetch(newRequest);
    
    // 克隆响应以避免 immutable headers 错误
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
      // @ts-ignore - webSocket 是 WebSocket 响应需要的
      webSocket: (response as any).webSocket,
    });
  } catch (error) {
    console.error('[Connection] Error:', error);
    return c.text('Internal server error', 500);
  }
});

/**
 * 处理 SSE 连接
 * 路由: /:platform/:randomKey/sse
 */
webhook.get('/:platform/:randomKey/sse', async (c) => {
  try {
    const randomKey = c.req.param('randomKey');
    const token = c.req.query('token');
    
    // 验证 proxy 存在
    const proxy = await getProxyByRandomKey(c.env!.DB as D1Database, randomKey);
    
    if (!proxy) {
      return c.text('Proxy not found', 404);
    }

    if (!proxy.active) {
      return c.text('Proxy is inactive', 403);
    }

    // 验证 access token
    if (proxy.access_token && proxy.access_token !== token) {
      return c.text('Invalid access token', 401);
    }

    // 转发到 Durable Object
    const doId = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.idFromName(randomKey);
    const doStub = (c.env as Record<string, any>).WEBHOOK_CONNECTIONS.get(doId);
    
    // 创建新的 Request 和 Headers
    const request = c.req.raw;
    const newHeaders = new Headers(request.headers);
    const newRequest = new Request(request.url, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });
    
    const response = await doStub.fetch(newRequest);
    
    // 克隆响应以避免 immutable headers 错误
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    console.error('[Connection] Error:', error);
    return c.text('Internal server error', 500);
  }
});

export default webhook;

