/**
 * Cloudflare Workers 环境绑定类型
 */
export interface Env {
  // D1 数据库
  DB: D1Database;
  
  // KV 命名空间
  SESSIONS: KVNamespace;
  
  // Durable Objects
  WEBHOOK_CONNECTIONS: DurableObjectNamespace;
  
  // 环境变量
  ENVIRONMENT: string;
  
  // OAuth Secrets
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITLAB_CLIENT_ID: string;
  GITLAB_CLIENT_SECRET: string;
  
  // 其他 Secrets
  JWT_SECRET: string;
  SESSION_SECRET: string;
}

