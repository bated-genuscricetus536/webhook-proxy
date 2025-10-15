import { CloudflareWebhookAdapter } from './base-cf.js';
import { WebhookEventData, AdapterConfig } from '../types/index.js';

/**
 * GitLab Webhook 适配器（Cloudflare Workers 版本）
 */
export class GitLabAdapter extends CloudflareWebhookAdapter {
  constructor(config: Partial<AdapterConfig> = {}) {
    super({
      platform: 'gitlab',
      verifySignature: true,
      ...config
    });
  }

  /**
   * 验证 GitLab webhook 令牌
   */
  async verifySignature(request: Request, _body: any): Promise<boolean> {
    if (!this.config.verifySignature) {
      return true;
    }

    const token = request.headers.get('x-gitlab-token');
    
    if (!token || !this.config.secret) {
      console.warn('[GitLab] Missing token or secret');
      return !this.config.verifySignature;
    }

    return token === this.config.secret;
  }

  /**
   * 解析 GitLab webhook 请求
   */
  parse(request: Request, body: any): WebhookEventData | null {
    const eventType = request.headers.get('x-gitlab-event');
    
    if (!eventType) {
      console.error('[GitLab] Missing event type');
      return null;
    }

    // 提取通用数据
    const data: Record<string, unknown> = {
      objectKind: body.object_kind,
      eventName: body.event_name,
      project: body.project ? {
        id: body.project.id,
        name: body.project.name,
        namespace: body.project.namespace,
        url: body.project.web_url
      } : undefined,
      user: body.user ? {
        id: body.user.id,
        name: body.user.name,
        username: body.user.username,
        email: body.user.email
      } : undefined
    };

    // 根据不同事件类型提取特定数据
    switch (body.object_kind) {
      case 'push':
        data.ref = body.ref;
        data.commits = body.commits;
        data.totalCommitsCount = body.total_commits_count;
        break;
      case 'merge_request':
        data.mergeRequest = {
          id: body.object_attributes.id,
          iid: body.object_attributes.iid,
          title: body.object_attributes.title,
          state: body.object_attributes.state,
          url: body.object_attributes.url
        };
        break;
      case 'issue':
        data.issue = {
          id: body.object_attributes.id,
          iid: body.object_attributes.iid,
          title: body.object_attributes.title,
          state: body.object_attributes.state,
          url: body.object_attributes.url
        };
        break;
      case 'pipeline':
        data.pipeline = {
          id: body.object_attributes.id,
          ref: body.object_attributes.ref,
          status: body.object_attributes.status,
          url: `${body.project.web_url}/-/pipelines/${body.object_attributes.id}`
        };
        break;
    }

    return {
      id: this.generateEventId(),
      platform: this.config.platform,
      type: eventType.toLowerCase().replace(/ /g, '_'),
      timestamp: Date.now(),
      headers: this.extractHeaders(request),
      payload: body,
      data
    };
  }
}

