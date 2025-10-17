import { getApiUrl, getToken } from './config.js';

/**
 * HTTP 响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * HTTP 客户端
 */
export class HttpClient {
  private baseUrl: string;
  private token?: string;

  constructor() {
    this.baseUrl = getApiUrl();
    this.token = getToken();
  }

  /**
   * 更新 token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 发送 HTTP 请求
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Type': 'cli', // 标识这是 CLI 请求
    };

    if (this.token) {
      headers['Cookie'] = `session=${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: response.ok,
        data: response.ok ? (data as T) : undefined,
        error: !response.ok ? (data?.error || data || 'Request failed') : undefined,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
        status: 0,
      };
    }
  }

  /**
   * GET 请求
   */
  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  /**
   * POST 请求
   */
  async post<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * PUT 请求
   */
  async put<T>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * DELETE 请求
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }
}

/**
 * 创建 HTTP 客户端实例
 */
export function createHttpClient(): HttpClient {
  return new HttpClient();
}

