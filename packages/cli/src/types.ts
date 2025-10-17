/**
 * API 响应类型
 */
export interface ApiError {
  error: string;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: number;
}

export interface Proxy {
  id: string;
  name: string;
  platform: string;
  random_key: string;
  verify_signature: boolean;
  active: boolean;
  created_at: number;
  updated_at: number;
  last_event_at: number | null;
  event_count: number;
  access_token: string | null;
  webhook_secret: string | null;
  has_access_token: boolean;
  has_webhook_secret: boolean;
  secrets_hidden: boolean;
  webhook_url: string;
  websocket_url: string;
  sse_url: string;
}

export interface CreateProxyRequest {
  name: string;
  platform: string;
  webhook_secret?: string;
  platform_app_id?: string;
  verify_signature?: boolean;
}

export interface UpdateProxyRequest {
  name?: string;
  webhook_secret?: string;
  verify_signature?: boolean;
  active?: boolean;
}

