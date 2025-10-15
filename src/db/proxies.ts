import { nanoid } from 'nanoid';
import { Proxy, CreateProxyRequest, UpdateProxyRequest } from '../types/index.js';

/**
 * 生成 access token（32 字符）
 */
function generateAccessToken(): string {
  return nanoid(32);
}

/**
 * Proxy 数据库操作
 */

export async function getProxyById(db: D1Database, proxyId: string): Promise<Proxy | null> {
  const result = await db
    .prepare('SELECT * FROM proxies WHERE id = ?')
    .bind(proxyId)
    .first();
  
  if (!result) return null;
  
  return dbRowToProxy(result);
}

export async function getProxyByRandomKey(db: D1Database, randomKey: string): Promise<Proxy | null> {
  const result = await db
    .prepare('SELECT * FROM proxies WHERE random_key = ?')
    .bind(randomKey)
    .first();
  
  if (!result) return null;
  
  return dbRowToProxy(result);
}

export async function getProxiesByUserId(db: D1Database, userId: string): Promise<Proxy[]> {
  const results = await db
    .prepare('SELECT * FROM proxies WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  return results.results.map(dbRowToProxy);
}

export async function createProxy(
  db: D1Database,
  userId: string,
  request: CreateProxyRequest
): Promise<Proxy> {
  const now = Date.now();
  const proxy: Proxy = {
    id: nanoid(),
    user_id: userId,
    name: request.name,
    platform: request.platform,
    random_key: nanoid(16),
    access_token: generateAccessToken(),
    webhook_secret: request.webhook_secret || null,
    verify_signature: request.verify_signature ?? true,
    active: true,
    created_at: now,
    updated_at: now,
    last_event_at: null,
    event_count: 0,
  };

  await db
    .prepare(`
      INSERT INTO proxies (
        id, user_id, name, platform, random_key, access_token, webhook_secret,
        verify_signature, active, created_at, updated_at, last_event_at, event_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      proxy.id,
      proxy.user_id,
      proxy.name,
      proxy.platform,
      proxy.random_key,
      proxy.access_token,
      proxy.webhook_secret,
      proxy.verify_signature ? 1 : 0,
      proxy.active ? 1 : 0,
      proxy.created_at,
      proxy.updated_at,
      proxy.last_event_at,
      proxy.event_count
    )
    .run();

  return proxy;
}

export async function updateProxy(
  db: D1Database,
  proxyId: string,
  updates: UpdateProxyRequest
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.webhook_secret !== undefined) {
    fields.push('webhook_secret = ?');
    values.push(updates.webhook_secret);
  }
  if (updates.verify_signature !== undefined) {
    fields.push('verify_signature = ?');
    values.push(updates.verify_signature ? 1 : 0);
  }
  if (updates.active !== undefined) {
    fields.push('active = ?');
    values.push(updates.active ? 1 : 0);
  }

  fields.push('updated_at = ?');
  values.push(Date.now());

  values.push(proxyId);

  await db
    .prepare(`UPDATE proxies SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function updateProxyEventCount(
  db: D1Database,
  proxyId: string
): Promise<void> {
  const now = Date.now();
  await db
    .prepare('UPDATE proxies SET event_count = event_count + 1, last_event_at = ? WHERE id = ?')
    .bind(now, proxyId)
    .run();
}

export async function deleteProxy(db: D1Database, proxyId: string): Promise<void> {
  await db
    .prepare('DELETE FROM proxies WHERE id = ?')
    .bind(proxyId)
    .run();
}

/**
 * 将数据库行转换为 Proxy 对象
 */
function dbRowToProxy(row: any): Proxy {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    platform: row.platform,
    random_key: row.random_key,
    access_token: row.access_token || null,
    webhook_secret: row.webhook_secret,
    verify_signature: Boolean(row.verify_signature),
    active: Boolean(row.active),
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_event_at: row.last_event_at,
    event_count: row.event_count,
  };
}

