import { DurableObject } from 'cloudflare:workers';
import { Env, WebhookEventData } from '../types/index.js';

/**
 * WebSocket 连接管理 Durable Object
 * 每个 random_key 对应一个 DO 实例，管理该 proxy 的所有 WebSocket 连接
 */
export class WebhookConnection extends DurableObject<Env> {
  private sessions: Map<WebSocket, { id: string; connectedAt: number }>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessions = new Map();
    
    // 定期清理断开的连接
    this.ctx.blockConcurrencyWhile(async () => {
      const alarm = await this.ctx.storage.getAlarm();
      if (!alarm) {
        await this.ctx.storage.setAlarm(Date.now() + 60000); // 1分钟后
      }
    });
  }

  /**
   * 处理 WebSocket 连接
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // WebSocket 握手
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocketUpgrade(request);
    }
    
    // SSE 连接
    if (url.pathname.endsWith('/sse')) {
      return this.handleSSE(request);
    }
    
    // 广播事件给所有连接
    if (request.method === 'POST' && url.pathname.endsWith('/broadcast')) {
      return this.handleBroadcast(request);
    }
    
    // 获取连接状态
    if (request.method === 'GET' && url.pathname.endsWith('/status')) {
      return this.handleStatus();
    }
    
    return new Response('Not Found', { status: 404 });
  }

  /**
   * 处理 WebSocket 升级
   */
  private handleWebSocketUpgrade(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    
    const sessionId = crypto.randomUUID();
    this.sessions.set(server, {
      id: sessionId,
      connectedAt: Date.now(),
    });

    // 发送欢迎消息
    server.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Connected to webhook proxy',
      timestamp: Date.now(),
    }));

    console.log(`[WebSocket] New connection: ${sessionId}, total: ${this.sessions.size}`);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * 处理 SSE 连接
   */
  private handleSSE(request: Request): Response {
    // SSE 在 Cloudflare Workers 中需要使用流式响应
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // 发送初始连接消息
    const sessionId = crypto.randomUUID();
    writer.write(
      encoder.encode(`data: ${JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Connected to webhook proxy',
        timestamp: Date.now(),
      })}\n\n`)
    );

    // 保持连接活跃 - 心跳
    const heartbeatInterval = setInterval(() => {
      writer.write(encoder.encode(`: heartbeat ${Date.now()}\n\n`))
        .catch(() => {
          clearInterval(heartbeatInterval);
        });
    }, 30000);

    // 存储 SSE 连接信息到 storage（用于后续广播）
    this.ctx.blockConcurrencyWhile(async () => {
      const sseConnections = await this.ctx.storage.get<string[]>('sse_connections') || [];
      sseConnections.push(sessionId);
      await this.ctx.storage.put('sse_connections', sseConnections);
    });

    console.log(`[SSE] New connection: ${sessionId}`);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  /**
   * 处理事件广播
   */
  private async handleBroadcast(request: Request): Promise<Response> {
    try {
      const event: WebhookEventData = await request.json();
      
      // 广播给所有 WebSocket 连接
      const message = JSON.stringify(event);
      let wsSuccess = 0;
      let wsFailed = 0;

      // 使用 getWebSockets() 获取所有活跃的 WebSocket（包括休眠的）
      const webSockets = this.ctx.getWebSockets();
      
      console.log(`[Broadcast] Found ${webSockets.length} WebSocket connections`);

      for (const ws of webSockets) {
        try {
          ws.send(message);
          wsSuccess++;
        } catch (error) {
          console.error(`[WebSocket] Send failed:`, error);
          wsFailed++;
        }
      }

      console.log(`[Broadcast] Event sent: ${event.type}, WS: ${wsSuccess} success, ${wsFailed} failed`);

      return new Response(JSON.stringify({
        status: 'ok',
        websocket: { success: wsSuccess, failed: wsFailed },
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[Broadcast] Error:', error);
      return new Response(JSON.stringify({ error: 'Broadcast failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * 获取连接状态
   */
  private handleStatus(): Response {
    const webSockets = this.ctx.getWebSockets();
    return new Response(JSON.stringify({
      websocket_connections: webSockets.length,
      hibernated_connections: this.sessions.size,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * WebSocket 消息处理
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      // 可以处理客户端发送的消息（如心跳）
      if (typeof message === 'string') {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      }
    } catch (error) {
      console.error(`[WebSocket] Message error for ${session.id}:`, error);
    }
  }

  /**
   * WebSocket 关闭处理
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const session = this.sessions.get(ws);
    if (session) {
      console.log(`[WebSocket] Connection closed: ${session.id}, code: ${code}`);
      this.sessions.delete(ws);
    }
  }

  /**
   * WebSocket 错误处理
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    const session = this.sessions.get(ws);
    if (session) {
      console.error(`[WebSocket] Error for ${session.id}:`, error);
      this.sessions.delete(ws);
    }
  }

  /**
   * 定时清理任务
   */
  async alarm(): Promise<void> {
    // 清理超时的连接（24小时无活动）
    const timeout = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [ws, session] of this.sessions.entries()) {
      if (now - session.connectedAt > timeout) {
        console.log(`[Cleanup] Closing idle connection: ${session.id}`);
        ws.close(1000, 'Timeout');
        this.sessions.delete(ws);
      }
    }

    // 设置下一次 alarm
    await this.ctx.storage.setAlarm(Date.now() + 60000);
  }
}

