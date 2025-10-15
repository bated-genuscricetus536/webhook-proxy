/**
 * 数据模型类型定义
 */

export interface User {
  id: string;
  username: string;
  email: string | null;
  email_verified: boolean;
  password_hash: string | null;
  avatar_url: string | null;
  mfa_enabled: boolean;
  mfa_secret: string | null;
  passkey_enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface OAuthBinding {
  id: string;
  user_id: string;
  platform: 'github' | 'gitlab';
  platform_user_id: string;
  platform_username: string | null;
  access_token: string;
  refresh_token: string | null;
  created_at: number;
  updated_at: number;
}

export interface Passkey {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  device_name: string | null;
  created_at: number;
  last_used_at: number | null;
}

export interface Proxy {
  id: string;
  user_id: string;
  name: string;
  platform: 'github' | 'gitlab';
  random_key: string;
  access_token: string | null;
  webhook_secret: string | null;
  verify_signature: boolean;
  active: boolean;
  created_at: number;
  updated_at: number;
  last_event_at: number | null;
  event_count: number;
}

export interface CreateProxyRequest {
  name: string;
  platform: 'github' | 'gitlab';
  webhook_secret?: string;
  verify_signature?: boolean;
}

export interface UpdateProxyRequest {
  name?: string;
  webhook_secret?: string;
  verify_signature?: boolean;
  active?: boolean;
}
