/**
 * Sentry Webhook Adapter for Cloudflare Workers
 * 
 * Sentry 使用 HMAC-SHA256 签名验证 Webhook 请求
 * 文档: https://docs.sentry.io/product/integrations/integration-platform/webhooks/
 */

import { WebhookEventData } from '../types/index.js';

export interface SentryConfig {
  webhookSecret?: string; // Sentry Webhook Client Secret
  verifySignature: boolean;
}

export interface SentryWebhookPayload {
  action?: string; // created, resolved, assigned, etc.
  installation?: {
    uuid: string;
  };
  data?: {
    issue?: {
      id: string;
      title: string;
      culprit: string;
      permalink: string;
      shortId: string;
      level: string; // error, warning, info, etc.
      status: string; // resolved, unresolved, ignored
      statusDetails: any;
      isPublic: boolean;
      platform: string;
      project: {
        id: string;
        name: string;
        slug: string;
      };
      type: string;
      metadata: {
        type?: string;
        value?: string;
        filename?: string;
        function?: string;
      };
      numComments: number;
      assignedTo?: {
        id: string;
        name: string;
        email: string;
      };
      isBookmarked: boolean;
      isSubscribed: boolean;
      hasSeen: boolean;
      annotations: any[];
      issueType: string;
      issueCategory: string;
      priority: string;
      priorityLockedAt: string | null;
    };
    error?: {
      message: string;
      type: string;
      data: any;
      url: string;
    };
    event?: {
      event_id: string;
      level: string;
      version: string;
      type: string;
      logentry: {
        formatted: string;
        message: string;
      };
      logger: string;
      platform: string;
      timestamp: number;
      received: number;
      environment: string;
      user: {
        id?: string;
        username?: string;
        email?: string;
        ip_address?: string;
      };
      request: {
        url: string;
        method: string;
        headers: any;
      };
      contexts: any;
      tags: Array<[string, string]>;
      exception?: {
        values: Array<{
          type: string;
          value: string;
          stacktrace?: {
            frames: any[];
          };
        }>;
      };
    };
  };
  actor?: {
    id: string;
    name: string;
    type: string;
  };
}

export class SentryAdapter {
  private config: SentryConfig;

  constructor(config: SentryConfig) {
    this.config = config;
  }

  /**
   * 验证 Sentry Webhook 签名
   * Sentry 使用 HMAC-SHA256，签名放在 Sentry-Hook-Signature 头中
   */
  private async verifySignature(
    payload: string,
    signatureHeader: string | null
  ): Promise<boolean> {
    if (!this.config.verifySignature || !this.config.webhookSecret) {
      return true;
    }

    if (!signatureHeader) {
      console.error('[Sentry] Missing Sentry-Hook-Signature header');
      return false;
    }

    try {
      // 计算期望的签名
      const expectedSignature = await this.computeSignature(payload);

      const isValid = this.secureCompare(expectedSignature, signatureHeader);

      if (!isValid) {
        console.error('[Sentry] Signature verification failed');
        console.error('[Sentry] Expected:', expectedSignature.substring(0, 20) + '...');
        console.error('[Sentry] Received:', signatureHeader.substring(0, 20) + '...');
      } else {
        console.log('[Sentry] Signature verified successfully');
      }

      return isValid;
    } catch (error) {
      console.error('[Sentry] Signature verification error:', error);
      return false;
    }
  }

  /**
   * 计算 HMAC-SHA256 签名
   */
  private async computeSignature(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.webhookSecret!);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

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
   * 处理 Sentry Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Sentry] Incoming webhook request');

    // 获取原始请求体
    const payload = await request.text();

    // 验证签名（如果配置了）
    if (this.config.verifySignature && this.config.webhookSecret) {
      const signatureHeader = request.headers.get('Sentry-Hook-Signature');

      if (!signatureHeader) {
        console.error('[Sentry] Missing Sentry-Hook-Signature header');
        return new Response('Unauthorized: Missing signature', { status: 401 });
      }

      const isValid = await this.verifySignature(payload, signatureHeader);

      if (!isValid) {
        console.error('[Sentry] Signature verification failed');
        return new Response('Unauthorized: Invalid signature', { status: 401 });
      }

      console.log('[Sentry] Signature verified successfully');
    } else {
      console.log('[Sentry] Signature verification disabled');
    }

    // Sentry expects a 200 response
    return new Response('OK', { status: 200 });
  }

  /**
   * 转换 Sentry Webhook 为标准事件格式
   */
  transform(payload: SentryWebhookPayload): WebhookEventData {
    const timestamp = Date.now();
    
    // 提取事件类型
    const eventType = payload.action || 'unknown';
    const issue = payload.data?.issue;
    const event = payload.data?.event;

    console.log('[Sentry] Transforming event:', eventType);

    return {
      id: `sentry-${issue?.id || event?.event_id || timestamp}-${Math.random().toString(36).substring(7)}`,
      platform: 'sentry',
      type: eventType,
      timestamp,
      headers: {},
      payload: payload,
      data: {
        action: eventType,
        issue_id: issue?.id,
        issue_title: issue?.title,
        issue_short_id: issue?.shortId,
        issue_level: issue?.level,
        issue_status: issue?.status,
        issue_platform: issue?.platform,
        project_id: issue?.project?.id,
        project_name: issue?.project?.name,
        project_slug: issue?.project?.slug,
        culprit: issue?.culprit,
        permalink: issue?.permalink,
        assigned_to: issue?.assignedTo?.name,
        event_id: event?.event_id,
        event_level: event?.level,
        event_message: event?.logentry?.formatted || event?.logentry?.message,
        event_environment: event?.environment,
        event_user_id: event?.user?.id,
        event_user_email: event?.user?.email,
        actor_name: payload.actor?.name,
        actor_type: payload.actor?.type,
      },
    };
  }
}

/**
 * 创建 Sentry 适配器
 */
export function createSentryAdapter(config: SentryConfig): SentryAdapter {
  return new SentryAdapter(config);
}

