import { WebhookEventData, AdapterConfig } from '../types/index.js';

/**
 * Cloudflare Workers Webhook 适配器基类
 */
export abstract class CloudflareWebhookAdapter {
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

