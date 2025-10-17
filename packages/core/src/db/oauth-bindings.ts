import { nanoid } from 'nanoid';
import { OAuthBinding } from '../types/index.js';

/**
 * OAuth 绑定数据库操作
 */

export async function getBindingById(db: D1Database, bindingId: string): Promise<OAuthBinding | null> {
  const result = await db
    .prepare('SELECT * FROM oauth_bindings WHERE id = ?')
    .bind(bindingId)
    .first();
  
  return result ? dbRowToBinding(result) : null;
}

export async function getBindingsByUserId(db: D1Database, userId: string): Promise<OAuthBinding[]> {
  const { results } = await db
    .prepare('SELECT * FROM oauth_bindings WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();
  
  return (results || []).map(dbRowToBinding);
}

export async function getBindingByPlatform(
  db: D1Database,
  platform: 'github' | 'gitlab',
  platformUserId: string
): Promise<OAuthBinding | null> {
  const result = await db
    .prepare('SELECT * FROM oauth_bindings WHERE platform = ? AND platform_user_id = ?')
    .bind(platform, platformUserId)
    .first();
  
  return result ? dbRowToBinding(result) : null;
}

export async function createBinding(
  db: D1Database,
  userId: string,
  platform: 'github' | 'gitlab',
  platformUserId: string,
  platformUsername: string,
  accessToken: string,
  refreshToken?: string
): Promise<OAuthBinding> {
  const now = Date.now();
  const binding: OAuthBinding = {
    id: nanoid(),
    user_id: userId,
    platform,
    platform_user_id: platformUserId,
    platform_username: platformUsername,
    access_token: accessToken,
    refresh_token: refreshToken || null,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(`
      INSERT INTO oauth_bindings (
        id, user_id, platform, platform_user_id, platform_username,
        access_token, refresh_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      binding.id,
      binding.user_id,
      binding.platform,
      binding.platform_user_id,
      binding.platform_username,
      binding.access_token,
      binding.refresh_token,
      binding.created_at,
      binding.updated_at
    )
    .run();

  return binding;
}

export async function updateBinding(
  db: D1Database,
  bindingId: string,
  updates: Partial<Pick<OAuthBinding, 'access_token' | 'refresh_token' | 'platform_username'>>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.access_token !== undefined) {
    fields.push('access_token = ?');
    values.push(updates.access_token);
  }
  if (updates.refresh_token !== undefined) {
    fields.push('refresh_token = ?');
    values.push(updates.refresh_token);
  }
  if (updates.platform_username !== undefined) {
    fields.push('platform_username = ?');
    values.push(updates.platform_username);
  }

  fields.push('updated_at = ?');
  values.push(Date.now());

  values.push(bindingId);

  await db
    .prepare(`UPDATE oauth_bindings SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteBinding(db: D1Database, bindingId: string): Promise<void> {
  await db
    .prepare('DELETE FROM oauth_bindings WHERE id = ?')
    .bind(bindingId)
    .run();
}

function dbRowToBinding(row: any): OAuthBinding {
  return {
    id: row.id,
    user_id: row.user_id,
    platform: row.platform,
    platform_user_id: row.platform_user_id,
    platform_username: row.platform_username,
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

