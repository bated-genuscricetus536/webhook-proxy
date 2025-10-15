/**
 * QQ Bot Webhook 适配器（Cloudflare Workers 版本）
 * 
 * 文档：https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html
 */

import { WebhookEventData } from '../types/index.js';
import { verifyQQBotSignature } from '../utils/ed25519.js';

export interface QQBotPayload {
  id: string;          // 事件id
  op: number;          // opcode
  d: any;              // 事件内容
  s: number;           // 序列号
  t: string;           // 事件类型
}

export interface QQBotConfig {
  appId: string;       // 机器人 App ID
  publicKey: string;   // 机器人公钥（用于验证签名）
  verifySignature: boolean;
}

/**
 * QQ Bot 适配器
 */
export class QQBotAdapter {
  constructor(private config: QQBotConfig) {}

  /**
   * 验证签名
   * 
   * QQ Bot 签名验证说明：
   * - Headers 中包含：
   *   - X-Signature-Timestamp: 时间戳
   *   - X-Signature-Ed25519: 签名（hex 格式）
   * - 签名算法：Ed25519
   * - 待签名消息：timestamp + body
   * - 公钥：从 QQ 开放平台获取（hex 格式，64 个字符，32 字节）
   */
  async verifySignature(
    body: string,
    timestamp: string,
    signature: string
  ): Promise<boolean> {
    if (!this.config.verifySignature) {
      console.log('[QQBot] Signature verification disabled');
      return true;
    }

    if (!this.config.publicKey) {
      console.error('[QQBot] Public key not configured');
      return false;
    }

    // 公钥格式验证（应该是 64 个 hex 字符 = 32 字节）
    if (!/^[0-9a-fA-F]{64}$/.test(this.config.publicKey)) {
      console.error('[QQBot] Invalid public key format (expected 64 hex characters)');
      console.error('[QQBot] Public key:', this.config.publicKey.substring(0, 16) + '...');
      return false;
    }

    console.log('[QQBot] Verifying signature...');
    console.log('[QQBot] Timestamp:', timestamp);
    console.log('[QQBot] Signature:', signature.substring(0, 16) + '...');
    console.log('[QQBot] Public key:', this.config.publicKey.substring(0, 16) + '...');

    const isValid = await verifyQQBotSignature(
      body,
      timestamp,
      signature,
      this.config.publicKey
    );

    if (!isValid) {
      console.error('[QQBot] Signature verification failed');
      console.error('[QQBot] Body preview:', body.substring(0, 100) + '...');
    } else {
      console.log('[QQBot] Signature verification passed');
    }

    return isValid;
  }

  /**
   * 将 QQ Bot Webhook 转换为标准事件格式
   */
  transform(payload: QQBotPayload): WebhookEventData {
    const { id, op, d, s, t } = payload;

    return {
      id,
      platform: 'qqbot',
      type: t,
      timestamp: Date.now(),
      headers: {
        'x-qqbot-op': op.toString(),
        'x-qqbot-seq': s.toString(),
      },
      payload: d,
      data: {
        opcode: op,
        event_type: t,
        sequence: s,
        event_id: id,
        event_data: d,
      },
    };
  }

  /**
   * 处理 Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    try {
      // 读取请求体
      const body = await request.text();
      
      // 获取签名相关 headers
      const timestamp = request.headers.get('X-Signature-Timestamp') || '';
      const signature = request.headers.get('X-Signature-Ed25519') || '';

      // 验证签名
      if (this.config.verifySignature) {
        const isValid = await this.verifySignature(body, timestamp, signature);
        if (!isValid) {
          return new Response('Invalid signature', { status: 401 });
        }
      }

      // 解析 payload
      const payload: QQBotPayload = JSON.parse(body);

      // 处理不同的 opcode
      switch (payload.op) {
        case 13: // 回调地址验证
          return this.handleVerification(payload);
        
        case 0: // Dispatch - 正常事件推送
          return this.handleDispatch(payload);
        
        default:
          console.warn('[QQBot] Unknown opcode:', payload.op);
          return this.createAckResponse();
      }
    } catch (error) {
      console.error('[QQBot] Handle webhook error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }

  /**
   * 处理回调地址验证
   */
  private handleVerification(payload: QQBotPayload): Response {
    console.log('[QQBot] Verification request:', payload.d);
    
    // 返回验证响应
    // OpCode 13 的响应格式
    return new Response(
      JSON.stringify({
        op: 13,
        d: {
          plain_token: payload.d.plain_token,
          signature: payload.d.event_ts, // 使用 event_ts 作为签名（示例）
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  /**
   * 处理事件分发
   */
  private handleDispatch(_payload: QQBotPayload): Response {
    // 返回 HTTP Callback ACK (OpCode 12)
    return this.createAckResponse();
  }

  /**
   * 创建 ACK 响应
   */
  private createAckResponse(): Response {
    return new Response(
      JSON.stringify({
        op: 12, // HTTP Callback ACK
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 创建 QQ Bot 适配器实例
 */
export function createQQBotAdapter(config: QQBotConfig): QQBotAdapter {
  return new QQBotAdapter(config);
}

