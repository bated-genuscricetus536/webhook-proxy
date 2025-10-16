/**
 * Generic Webhook Adapter for Cloudflare Workers
 * 
 * 通用 Webhook 适配器，支持接收任何第三方服务的 Webhook
 * 不做特定平台的签名验证，只支持简单的 Bearer Token 验证
 */

export interface GenericConfig {
  verifySignature: boolean;
  secret?: string; // 可选的验证 Token
}

export interface GenericWebhookEvent {
  id: string;
  platform: 'generic';
  type: string;
  timestamp: number;
  headers: Record<string, string>;
  payload: any;
  data: {
    method: string;
    path: string;
    query: Record<string, string>;
    content_type: string | null;
  };
}

export class GenericAdapter {
  private config: GenericConfig;

  constructor(config: GenericConfig) {
    this.config = config;
  }

  /**
   * 处理 Generic Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Generic] Incoming webhook request');

    // 简单的 Token 验证
    if (this.config.verifySignature && this.config.secret) {
      const authHeader = request.headers.get('Authorization');
      
      if (!authHeader) {
        console.error('[Generic] Missing Authorization header');
        return new Response('Unauthorized: Missing authorization', { status: 401 });
      }

      // 支持两种格式：
      // 1. Bearer <token>
      // 2. 直接是 token
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      if (token !== this.config.secret) {
        console.error('[Generic] Invalid token');
        return new Response('Unauthorized: Invalid token', { status: 401 });
      }

      console.log('[Generic] Token verified successfully');
    } else {
      console.log('[Generic] Token verification disabled');
    }

    // 读取请求体
    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    let body: any;

    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } else if (contentType.includes('text/')) {
        body = await request.text();
      } else {
        // 其他类型，尝试读取为文本
        body = await request.text();
      }
    } catch (error) {
      console.error('[Generic] Failed to parse body:', error);
      body = null;
    }

    console.log('[Generic] Request received, Content-Type:', contentType);
    console.log('[Generic] Body type:', typeof body);

    // Generic Webhook 总是返回 200 OK
    return new Response('OK', { status: 200 });
  }

  /**
   * 转换 Generic Webhook 为标准事件格式
   */
  transform(request: Request, payload: any): GenericWebhookEvent {
    const url = new URL(request.url);
    const timestamp = Date.now();
    
    // 提取所有请求头
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 尝试从 payload 或 headers 中推断事件类型
    let eventType = 'webhook';
    
    // 常见的事件类型字段
    if (payload && typeof payload === 'object') {
      eventType = payload.event || 
                  payload.event_type || 
                  payload.type || 
                  payload.action ||
                  headers['x-event-type'] ||
                  headers['x-webhook-event'] ||
                  'webhook';
    }

    // 提取查询参数
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const event: GenericWebhookEvent = {
      id: `generic-${timestamp}-${Math.random().toString(36).substring(7)}`,
      platform: 'generic',
      type: String(eventType),
      timestamp,
      headers,
      payload,
      data: {
        method: request.method,
        path: url.pathname,
        query,
        content_type: request.headers.get('Content-Type'),
      },
    };

    console.log('[Generic] Transformed event:', {
      id: event.id,
      type: event.type,
      method: event.data.method,
      content_type: event.data.content_type,
    });

    return event;
  }
}

/**
 * 创建 Generic 适配器
 */
export function createGenericAdapter(config: GenericConfig): GenericAdapter {
  return new GenericAdapter(config);
}

