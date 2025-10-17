/**
 * 适配器工厂 - 统一创建和处理不同平台的适配器
 */

import { GitHubAdapter, GitLabAdapter } from '../adapters/index-cf.js';
import { createQQBotAdapter } from '../adapters/qqbot-cf.js';
import { createTelegramAdapter } from '../adapters/telegram-cf.js';
import { createStripeAdapter } from '../adapters/stripe-cf.js';
import { createJenkinsAdapter } from '../adapters/jenkins-cf.js';
import { createJiraAdapter } from '../adapters/jira-cf.js';
import { createSentryAdapter } from '../adapters/sentry-cf.js';
import { createGenericAdapter } from '../adapters/generic-cf.js';
import { Proxy } from '../types/models.js';
import { WebhookAdapter } from '../types/adapter.js';

/**
 * 适配器工厂 - 根据平台创建对应的适配器
 * 所有适配器都实现 WebhookAdapter 接口
 */
export function createAdapter(proxy: Proxy): WebhookAdapter | null {
  const platform = proxy.platform;

  switch (platform) {
    case 'github':
      return new GitHubAdapter({
        secret: proxy.webhook_secret || '',
        verifySignature: proxy.verify_signature,
      });

    case 'gitlab':
      return new GitLabAdapter({
        secret: proxy.webhook_secret || '',
        verifySignature: proxy.verify_signature,
      });

    case 'qqbot':
      return createQQBotAdapter({
        appId: proxy.platform_app_id || '',
        secret: proxy.webhook_secret || '',
        verifySignature: proxy.verify_signature,
      });

    case 'telegram':
      return createTelegramAdapter({
        botToken: proxy.platform_app_id || '',
        secretToken: proxy.webhook_secret || undefined,
        verifySignature: proxy.verify_signature,
      });

    case 'stripe':
      return createStripeAdapter({
        webhookSecret: proxy.webhook_secret || '',
        verifySignature: proxy.verify_signature,
      });

    case 'jenkins':
      return createJenkinsAdapter({
        token: proxy.webhook_secret || undefined,
        verifySignature: proxy.verify_signature,
      });

    case 'jira':
      return createJiraAdapter({
        webhookSecret: proxy.webhook_secret || undefined,
        verifySignature: proxy.verify_signature,
      });

    case 'sentry':
      return createSentryAdapter({
        webhookSecret: proxy.webhook_secret || undefined,
        verifySignature: proxy.verify_signature,
      });

    case 'generic':
      return createGenericAdapter({
        verifySignature: proxy.verify_signature,
        secret: proxy.webhook_secret || undefined,
      });

    default:
      return null;
  }
}

/**
 * 判断平台是否需要特殊处理（需要克隆请求）
 * 注意：现在所有平台都实现了 handleWebhook，不再需要区分
 * 保留此函数用于向后兼容
 * @deprecated 所有平台现在都使用统一的 handleWebhook 方法
 */
export function needsRequestCloning(_platform: string): boolean {
  // 所有平台现在都通过 handleWebhook 处理，不再需要区分
  return false;
}

/**
 * 从请求中解析 payload
 */
export async function parsePayload(
  request: Request,
  platform: string
): Promise<any> {
  const contentType = request.headers.get('Content-Type') || '';

  try {
    if (platform === 'generic') {
      // Generic 支持多种格式
      if (contentType.includes('application/json')) {
        return await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        return Object.fromEntries(formData.entries());
      } else {
        return await request.text();
      }
    } else {
      // 其他平台都是 JSON
      return await request.json();
    }
  } catch (error) {
    console.error(`[${platform}] Failed to parse payload:`, error);
    throw error;
  }
}

