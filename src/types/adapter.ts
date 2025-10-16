/**
 * 统一的 Webhook Adapter 接口
 * 所有平台适配器都应该实现这个接口
 */

import { WebhookEventData } from './index.js';

export interface WebhookAdapter {
  /**
   * 处理 Webhook 请求
   * - 验证签名
   - 返回响应
   * @param request 原始请求对象
   * @returns Response 对象（200 表示成功）
   */
  handleWebhook(request: Request): Promise<Response>;

  /**
   * 转换平台 payload 为标准事件格式
   * @param payload 平台原始 payload
   * @param request 可选的原始请求对象（用于提取额外信息）
   * @returns 标准化的事件数据
   */
  transform(payload: any, request?: Request): WebhookEventData;
}

/**
 * Adapter 配置基类
 */
export interface AdapterConfig {
  verifySignature: boolean;
}

