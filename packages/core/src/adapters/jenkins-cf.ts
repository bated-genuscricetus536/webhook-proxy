/**
 * Jenkins Webhook Adapter for Cloudflare Workers
 * 
 * Jenkins 支持简单的 Token 验证或无验证
 * 文档: https://plugins.jenkins.io/generic-webhook-trigger/
 */

import { WebhookEventData } from '../types/index.js';

export interface JenkinsConfig {
  token?: string; // 可选的认证 Token
  verifySignature: boolean;
}

export interface JenkinsWebhookPayload {
  name?: string;
  url?: string;
  build?: {
    full_url?: string;
    number?: number;
    queue_id?: number;
    timestamp?: number;
    duration?: number;
    result?: string; // SUCCESS, FAILURE, UNSTABLE, ABORTED
    phase?: string; // STARTED, COMPLETED, FINALIZED
    status?: string;
    url?: string;
    scm?: {
      url?: string;
      branch?: string;
      commit?: string;
    };
    artifacts?: any[];
    log?: string;
  };
}

export class JenkinsAdapter {
  private config: JenkinsConfig;

  constructor(config: JenkinsConfig) {
    this.config = config;
  }

  /**
   * 处理 Jenkins Webhook 请求
   */
  async handleWebhook(request: Request): Promise<Response> {
    console.log('[Jenkins] Incoming webhook request');

    // Token 验证（如果配置了）
    if (this.config.verifySignature && this.config.token) {
      const url = new URL(request.url);
      const tokenParam = url.searchParams.get('token');
      const authHeader = request.headers.get('Authorization');

      // 支持两种验证方式：
      // 1. URL 参数: ?token=xxx
      // 2. Authorization 头: Bearer xxx 或直接 xxx
      let providedToken: string | null = null;

      if (tokenParam) {
        providedToken = tokenParam;
      } else if (authHeader) {
        providedToken = authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : authHeader;
      }

      if (!providedToken || providedToken !== this.config.token) {
        console.error('[Jenkins] Token verification failed');
        return new Response('Unauthorized: Invalid token', { status: 401 });
      }

      console.log('[Jenkins] Token verified successfully');
    } else {
      console.log('[Jenkins] Token verification disabled');
    }

    // Jenkins expects a 200 response
    return new Response('OK', { status: 200 });
  }

  /**
   * 转换 Jenkins Webhook 为标准事件格式
   */
  transform(payload: JenkinsWebhookPayload): WebhookEventData {
    const timestamp = payload.build?.timestamp || Date.now();
    
    // 推断事件类型
    let eventType = 'build';
    if (payload.build?.phase) {
      eventType = `build.${payload.build.phase.toLowerCase()}`;
    } else if (payload.build?.result) {
      eventType = `build.${payload.build.result.toLowerCase()}`;
    }

    console.log('[Jenkins] Transforming event:', eventType);

    return {
      id: `jenkins-${payload.build?.number || Date.now()}-${Math.random().toString(36).substring(7)}`,
      platform: 'jenkins',
      type: eventType,
      timestamp,
      headers: {},
      payload: payload,
      data: {
        job_name: payload.name,
        job_url: payload.url,
        build_number: payload.build?.number,
        build_url: payload.build?.full_url || payload.build?.url,
        build_result: payload.build?.result,
        build_phase: payload.build?.phase,
        build_status: payload.build?.status,
        build_duration: payload.build?.duration,
        scm_url: payload.build?.scm?.url,
        scm_branch: payload.build?.scm?.branch,
        scm_commit: payload.build?.scm?.commit,
      },
    };
  }
}

/**
 * 创建 Jenkins 适配器
 */
export function createJenkinsAdapter(config: JenkinsConfig): JenkinsAdapter {
  return new JenkinsAdapter(config);
}

