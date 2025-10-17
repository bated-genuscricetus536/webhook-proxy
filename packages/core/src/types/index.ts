/**
 * Webhook 事件数据结构
 */
export interface WebhookEventData {
  /** 事件 ID */
  id: string;
  /** 事件来源平台 */
  platform: string;
  /** 事件类型 */
  type: string;
  /** 事件时间戳 */
  timestamp: number;
  /** 原始请求头 */
  headers: Record<string, string>;
  /** 原始请求体 */
  payload: unknown;
  /** 标准化后的数据 */
  data: Record<string, unknown>;
}

/**
 * 适配器配置
 */
export interface AdapterConfig {
  /** 平台名称 */
  platform: string;
  /** 是否启用签名验证 */
  verifySignature: boolean;
  /** 签名密钥 */
  secret?: string;
}

export * from './env.js';
export * from './models.js';

