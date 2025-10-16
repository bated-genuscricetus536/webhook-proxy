/**
 * Stripe Webhook Adapter for Cloudflare Workers
 * 
 * Stripe 使用 HMAC-SHA256 签名验证 Webhook 请求
 * 文档: https://stripe.com/docs/webhooks/signatures
 */

import { WebhookEventData } from '../types/index.js';

export interface StripeConfig {
  webhookSecret: string; // Stripe Webhook 签名密钥（whsec_xxx）
  verifySignature: boolean;
}

export interface StripeWebhookPayload {
  id: string;
  object: 'event';
  api_version: string;
  created: number;
  data: {
    object: any;
    previous_attributes?: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string; // 事件类型，如 payment_intent.succeeded
}

export class StripeAdapter {
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  /**
   * 验证 Stripe Webhook 签名
   * Stripe-Signature 格式: t=1234567890,v1=signature,v0=old_signature
   */
  private async verifySignature(
    payload: string,
    signatureHeader: string
  ): Promise<boolean> {
    if (!this.config.verifySignature || !this.config.webhookSecret) {
      return true;
    }

    try {
      // 解析签名头
      const signatures = this.parseSignatureHeader(signatureHeader);
      
      if (!signatures.timestamp || !signatures.v1) {
        console.error('[Stripe] Invalid signature header format');
        return false;
      }

      // 检查时间戳（防止重放攻击，允许 5 分钟误差）
      const timestamp = parseInt(signatures.timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes

      if (Math.abs(currentTime - timestamp) > tolerance) {
        console.error('[Stripe] Timestamp too old or too new');
        return false;
      }

      // 构造签名字符串: timestamp.payload
      const signedPayload = `${signatures.timestamp}.${payload}`;

      // 计算期望的签名
      const expectedSignature = await this.computeSignature(signedPayload);

      // 比较签名（使用 v1）
      const isValid = this.secureCompare(expectedSignature, signatures.v1);

      if (!isValid) {
        console.error('[Stripe] Signature verification failed');
        console.error('[Stripe] Expected:', expectedSignature.substring(0, 20) + '...');
        console.error('[Stripe] Received:', signatures.v1.substring(0, 20) + '...');
      } else {
        console.log('[Stripe] Signature verified successfully');
      }

      return isValid;
    } catch (error) {
      console.error('[Stripe] Signature verification error:', error);
      return false;
    }
  }

  /**
   * 解析 Stripe-Signature 头
   */
  private parseSignatureHeader(header: string): Record<string, string> {
    const parts = header.split(',');
    const result: Record<string, string> = {};

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        result[key.trim()] = value.trim();
      }
    }

    return result;
  }

  /**
   * 计算 HMAC-SHA256 签名
   */
  private async computeSignature(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.webhookSecret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
    // 转换为十六进制字符串
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 安全的字符串比较（防止时序攻击）
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * 处理 Stripe Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Stripe] Incoming webhook request');

    // 获取原始请求体（必须是原始字符串才能验证签名）
    const payload = await request.text();

    // 验证签名
    if (this.config.verifySignature && this.config.webhookSecret) {
      const signatureHeader = request.headers.get('stripe-signature');

      if (!signatureHeader) {
        console.error('[Stripe] Missing Stripe-Signature header');
        return new Response('Unauthorized: Missing signature', { status: 401 });
      }

      const isValid = await this.verifySignature(payload, signatureHeader);

      if (!isValid) {
        console.error('[Stripe] Signature verification failed');
        return new Response('Unauthorized: Invalid signature', { status: 401 });
      }

      console.log('[Stripe] Signature verified successfully');
    } else {
      console.log('[Stripe] Signature verification disabled');
    }

    // Stripe expects a 200 response
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * 转换 Stripe Webhook 为标准事件格式
   */
  transform(payload: StripeWebhookPayload): WebhookEventData {
    console.log('[Stripe] Transforming event:', payload.type);

    return {
      id: `stripe-${payload.id}`,
      platform: 'stripe',
      type: payload.type,
      timestamp: payload.created * 1000, // Stripe 使用秒级时间戳
      headers: {},
      payload: payload,
      data: {
        event_id: payload.id,
        event_type: payload.type,
        livemode: payload.livemode,
        object_type: payload.data.object.object,
        object_id: payload.data.object.id,
        api_version: payload.api_version,
      },
    };
  }
}

/**
 * 创建 Stripe 适配器
 */
export function createStripeAdapter(config: StripeConfig): StripeAdapter {
  return new StripeAdapter(config);
}

