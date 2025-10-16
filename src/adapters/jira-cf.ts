/**
 * Jira Webhook Adapter for Cloudflare Workers
 * 
 * Jira 支持 HMAC-SHA256 签名验证（如果配置了 secret）
 * 文档: https://developer.atlassian.com/server/jira/platform/webhooks/
 */

import { WebhookEvent } from '../types/models.js';

export interface JiraConfig {
  webhookSecret?: string;
  verifySignature: boolean;
}

export interface JiraWebhookPayload {
  timestamp?: number;
  webhookEvent?: string; // jira:issue_created, jira:issue_updated, etc.
  issue_event_type_name?: string; // issue_created, issue_updated, etc.
  user?: {
    self?: string;
    accountId?: string;
    emailAddress?: string;
    displayName?: string;
  };
  issue?: {
    id?: string;
    key?: string;
    self?: string;
    fields?: {
      summary?: string;
      description?: string;
      status?: {
        name?: string;
        statusCategory?: {
          key?: string;
          name?: string;
        };
      };
      issuetype?: {
        name?: string;
        iconUrl?: string;
      };
      priority?: {
        name?: string;
        iconUrl?: string;
      };
      assignee?: {
        displayName?: string;
        emailAddress?: string;
      };
      reporter?: {
        displayName?: string;
        emailAddress?: string;
      };
      created?: string;
      updated?: string;
      project?: {
        key?: string;
        name?: string;
      };
    };
  };
  changelog?: {
    items?: Array<{
      field?: string;
      fieldtype?: string;
      from?: string;
      fromString?: string;
      to?: string;
      toString?: string;
    }>;
  };
  comment?: {
    id?: string;
    body?: string;
    author?: {
      displayName?: string;
      emailAddress?: string;
    };
  };
}

export class JiraAdapter {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  /**
   * 验证 Jira Webhook 签名
   * Jira 使用 HMAC-SHA256，签名放在请求体的特殊字段中
   * 注意：Jira Cloud 和 Server 的签名机制不同
   */
  private async verifySignature(
    payload: string,
    signatureHeader: string | null
  ): Promise<boolean> {
    if (!this.config.verifySignature || !this.config.webhookSecret) {
      return true;
    }

    if (!signatureHeader) {
      console.error('[Jira] Missing signature header');
      return false;
    }

    try {
      // 计算期望的签名
      const expectedSignature = await this.computeSignature(payload);

      // Jira 签名格式: sha256=<hex_signature>
      const receivedSignature = signatureHeader.startsWith('sha256=')
        ? signatureHeader.substring(7)
        : signatureHeader;

      const isValid = this.secureCompare(expectedSignature, receivedSignature);

      if (!isValid) {
        console.error('[Jira] Signature verification failed');
        console.error('[Jira] Expected:', expectedSignature.substring(0, 20) + '...');
        console.error('[Jira] Received:', receivedSignature.substring(0, 20) + '...');
      } else {
        console.log('[Jira] Signature verified successfully');
      }

      return isValid;
    } catch (error) {
      console.error('[Jira] Signature verification error:', error);
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
   * 处理 Jira Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Jira] Incoming webhook request');

    // 获取原始请求体
    const payload = await request.text();

    // 验证签名（如果配置了）
    if (this.config.verifySignature && this.config.webhookSecret) {
      // Jira 使用 X-Hub-Signature 或 X-Atlassian-Webhook-Signature
      const signatureHeader =
        request.headers.get('X-Hub-Signature-256') ||
        request.headers.get('X-Hub-Signature') ||
        request.headers.get('X-Atlassian-Webhook-Signature');

      if (!signatureHeader) {
        console.error('[Jira] Missing signature header');
        return new Response('Unauthorized: Missing signature', { status: 401 });
      }

      const isValid = await this.verifySignature(payload, signatureHeader);

      if (!isValid) {
        console.error('[Jira] Signature verification failed');
        return new Response('Unauthorized: Invalid signature', { status: 401 });
      }

      console.log('[Jira] Signature verified successfully');
    } else {
      console.log('[Jira] Signature verification disabled');
    }

    // Jira expects a 200 response
    return new Response('OK', { status: 200 });
  }

  /**
   * 转换 Jira Webhook 为标准事件格式
   */
  transform(payload: JiraWebhookPayload): WebhookEvent {
    const timestamp = payload.timestamp || Date.now();
    
    // 提取事件类型
    let eventType = payload.webhookEvent || payload.issue_event_type_name || 'unknown';
    // 移除 jira: 前缀
    eventType = eventType.replace(/^jira:/, '');

    console.log('[Jira] Transforming event:', eventType);

    return {
      id: `jira-${payload.issue?.key || Date.now()}-${Math.random().toString(36).substring(7)}`,
      platform: 'jira',
      type: eventType,
      timestamp,
      headers: {},
      payload: payload,
      data: {
        event_type: eventType,
        issue_key: payload.issue?.key,
        issue_id: payload.issue?.id,
        issue_summary: payload.issue?.fields?.summary,
        issue_type: payload.issue?.fields?.issuetype?.name,
        issue_status: payload.issue?.fields?.status?.name,
        issue_priority: payload.issue?.fields?.priority?.name,
        project_key: payload.issue?.fields?.project?.key,
        project_name: payload.issue?.fields?.project?.name,
        assignee: payload.issue?.fields?.assignee?.displayName,
        reporter: payload.issue?.fields?.reporter?.displayName,
        user: payload.user?.displayName,
        has_changelog: !!payload.changelog?.items?.length,
        has_comment: !!payload.comment,
      },
    };
  }
}

/**
 * 创建 Jira 适配器
 */
export function createJiraAdapter(config: JiraConfig): JiraAdapter {
  return new JiraAdapter(config);
}

