import { CloudflareWebhookAdapter } from './base-cf.js';
import { WebhookEventData, AdapterConfig } from '../types/index.js';

/**
 * GitHub Webhook 适配器（Cloudflare Workers 版本）
 */
export class GitHubAdapter extends CloudflareWebhookAdapter {
  constructor(config: Partial<AdapterConfig> = {}) {
    super({
      platform: 'github',
      verifySignature: true,
      ...config
    });
  }

  /**
   * 验证 GitHub webhook 签名
   */
  async verifySignature(request: Request, body: any): Promise<boolean> {
    if (!this.config.verifySignature) {
      return true;
    }

    const signature = request.headers.get('x-hub-signature-256');
    if (!signature || !this.config.secret) {
      console.warn('[GitHub] Missing signature or secret');
      return !this.config.verifySignature;
    }

    const bodyString = JSON.stringify(body);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.config.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(bodyString)
    );

    const signatureArray = Array.from(new Uint8Array(signatureBytes));
    const signatureHex = 'sha256=' + signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signature === signatureHex;
  }

  /**
   * 解析 GitHub webhook 请求
   */
  parse(request: Request, body: any): WebhookEventData | null {
    const eventType = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    if (!eventType) {
      console.error('[GitHub] Missing event type');
      return null;
    }

    // 提取通用数据
    const data: Record<string, unknown> = {
      action: body.action,
      repository: body.repository ? {
        id: body.repository.id,
        name: body.repository.name,
        fullName: body.repository.full_name,
        url: body.repository.html_url
      } : undefined,
      sender: body.sender ? {
        id: body.sender.id,
        login: body.sender.login,
        type: body.sender.type
      } : undefined
    };

    // 根据不同事件类型提取特定数据
    switch (eventType) {
      case 'push':
        data.ref = body.ref;
        data.commits = body.commits;
        data.pusher = body.pusher;
        break;
      case 'pull_request':
        data.pullRequest = {
          id: body.pull_request.id,
          number: body.pull_request.number,
          title: body.pull_request.title,
          state: body.pull_request.state,
          url: body.pull_request.html_url
        };
        break;
      case 'issues':
        data.issue = {
          id: body.issue.id,
          number: body.issue.number,
          title: body.issue.title,
          state: body.issue.state,
          url: body.issue.html_url
        };
        break;
    }

    return {
      id: deliveryId || this.generateEventId(),
      platform: this.config.platform,
      type: eventType,
      timestamp: Date.now(),
      headers: this.extractHeaders(request),
      payload: body,
      data
    };
  }
}

