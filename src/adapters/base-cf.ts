import { WebhookEventData, AdapterConfig } from '../types/index.js';
import { WebhookAdapter } from '../types/adapter.js';

/**
 * Cloudflare Workers Webhook 适配器基类
 * 实现统一的 WebhookAdapter 接口
 */
export abstract class CloudflareWebhookAdapter implements WebhookAdapter {
  protected config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = config;
  }

  /**
   * 获取平台名称
   */
  getPlatform(): string {
    return this.config.platform;
  }

  /**
   * 处理 Webhook 请求（统一接口）
   * GitHub/GitLab 使用这个方法
   */
  async handleWebhook(request: Request): Promise<Response> {
    try {
      // 解析请求体
      const body = await request.json();
      
      // 验证签名
      const isValid = await this.verifySignature(request, body);
      
      if (!isValid) {
        console.error(`[${this.config.platform}] Signature verification failed`);
        return new Response('Unauthorized', { status: 401 });
      }
      
      // 返回成功响应
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error(`[${this.config.platform}] Error handling webhook:`, error);
      return new Response('Bad Request', { status: 400 });
    }
  }

  /**
   * 转换为标准事件格式（统一接口）
   */
  transform(payload: any, request?: Request): WebhookEventData {
    if (request) {
      const event = this.parse(request, payload);
      if (event) {
        return event;
      }
    }
    
    // 如果没有 request 或 parse 失败，返回基础事件
    return {
      id: this.generateEventId(),
      platform: this.config.platform,
      type: 'unknown',
      timestamp: Date.now(),
      headers: {},
      payload: payload,
      data: {},
    };
  }

  /**
   * 验证 webhook 签名
   * @param request Cloudflare Workers Request 对象
   * @param body 请求体（已解析）
   * @returns 验证是否通过
   */
  abstract verifySignature(request: Request, body: any): Promise<boolean>;

  /**
   * 解析 webhook 请求
   * @param request Cloudflare Workers Request 对象
   * @param body 请求体（已解析）
   * @returns 标准化的 webhook 事件
   */
  abstract parse(request: Request, body: any): WebhookEventData | null;

  /**
   * 提取请求头
   */
  protected extractHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  /**
   * 生成唯一事件 ID
   */
  protected generateEventId(): string {
    return `${this.config.platform}-${Date.now()}-${crypto.randomUUID()}`;
  }
}

