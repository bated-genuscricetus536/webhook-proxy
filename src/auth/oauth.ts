import { Env } from '../types/index.js';

/**
 * OAuth 提供者接口
 */
interface OAuthProvider {
  getAuthUrl(state: string, redirectUri: string): string;
  getAccessToken(code: string, redirectUri: string): Promise<string>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}

export interface OAuthUserInfo {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
}

/**
 * GitHub OAuth 提供者
 */
export class GitHubOAuthProvider implements OAuthProvider {
  constructor(
    private clientId: string,
    private clientSecret: string
  ) {}

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Webhook-Proxy',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub OAuth error: ${response.statusText}`);
    }

    const data = await response.json() as { access_token?: string; error?: string };
    
    if (data.error || !data.access_token) {
      throw new Error(`GitHub OAuth error: ${data.error || 'No access token'}`);
    }

    return data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Webhook-Proxy',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const user = await response.json() as {
      id: number;
      login: string;
      email: string | null;
      avatar_url: string;
    };

    return {
      id: user.id.toString(),
      username: user.login,
      email: user.email,
      avatar_url: user.avatar_url,
    };
  }
}

/**
 * GitLab OAuth 提供者
 */
export class GitLabOAuthProvider implements OAuthProvider {
  constructor(
    private clientId: string,
    private clientSecret: string
  ) {}

  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read_user',
      state,
    });
    return `https://gitlab.com/oauth/authorize?${params.toString()}`;
  }

  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    const requestBody = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    };

    console.log('[GitLab OAuth] Request:', {
      url: 'https://gitlab.com/oauth/token',
      redirect_uri: redirectUri,
      client_id: this.clientId.substring(0, 8) + '...',
    });

    const response = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Proxy',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[GitLab OAuth] Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200),
    });

    if (!response.ok) {
      throw new Error(`GitLab OAuth error: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText) as { access_token?: string; error?: string; error_description?: string };
    
    if (data.error || !data.access_token) {
      throw new Error(`GitLab OAuth error: ${data.error || 'No access token'} - ${data.error_description || ''}`);
    }

    return data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'Webhook-Proxy',
      },
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.statusText}`);
    }

    const user = await response.json() as {
      id: number;
      username: string;
      email: string | null;
      avatar_url: string;
    };

    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
    };
  }
}

/**
 * 创建 OAuth 提供者
 */
export function createOAuthProvider(
  platform: 'github' | 'gitlab',
  env: Env
): OAuthProvider {
  if (platform === 'github') {
    return new GitHubOAuthProvider(
      env.GITHUB_CLIENT_ID,
      env.GITHUB_CLIENT_SECRET
    );
  } else {
    return new GitLabOAuthProvider(
      env.GITLAB_CLIENT_ID,
      env.GITLAB_CLIENT_SECRET
    );
  }
}

/**
 * 生成随机 state
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成 session token
 */
export async function generateSessionToken(userId: string, secret: string): Promise<string> {
  const data = JSON.stringify({
    userId,
    timestamp: Date.now(),
  });
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa(data) + '.' + signatureHex;
}

/**
 * 验证 session token
 */
export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
  try {
    const [dataB64, signatureHex] = token.split('.');
    if (!dataB64 || !signatureHex) {
      return null;
    }
    
    const data = atob(dataB64);
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = new Uint8Array(
      signatureHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      encoder.encode(data)
    );
    
    if (!valid) {
      return null;
    }
    
    const parsed = JSON.parse(data) as { userId: string; timestamp: number };
    
    // 检查是否过期（30天）
    if (Date.now() - parsed.timestamp > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
    
    return parsed.userId;
  } catch {
    return null;
  }
}

