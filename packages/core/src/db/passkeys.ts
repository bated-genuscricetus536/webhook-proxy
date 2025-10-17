/**
 * Passkey 数据库操作
 */
import { nanoid } from 'nanoid';
import { Passkey } from '../types/index.js';

/**
 * 创建 Passkey
 */
export async function createPasskey(
  db: D1Database,
  userId: string,
  credentialId: string,
  publicKey: string,
  deviceName: string | null = null
): Promise<Passkey> {
  const now = Date.now();
  const passkey: Passkey = {
    id: nanoid(),
    user_id: userId,
    credential_id: credentialId,
    public_key: publicKey,
    counter: 0,
    device_name: deviceName,
    created_at: now,
    last_used_at: null,
  };

  await db
    .prepare(`
      INSERT INTO passkeys (
        id, user_id, credential_id, public_key, counter,
        device_name, created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      passkey.id,
      passkey.user_id,
      passkey.credential_id,
      passkey.public_key,
      passkey.counter,
      passkey.device_name,
      passkey.created_at,
      passkey.last_used_at
    )
    .run();

  return passkey;
}

/**
 * 根据 credential_id 获取 Passkey
 */
export async function getPasskeyByCredentialId(
  db: D1Database,
  credentialId: string
): Promise<Passkey | null> {
  const result = await db
    .prepare('SELECT * FROM passkeys WHERE credential_id = ?')
    .bind(credentialId)
    .first();

  if (!result) return null;

  return dbRowToPasskey(result);
}

/**
 * 获取用户的所有 Passkeys
 */
export async function getPasskeysByUserId(
  db: D1Database,
  userId: string
): Promise<Passkey[]> {
  const result = await db
    .prepare('SELECT * FROM passkeys WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();

  return result.results.map(dbRowToPasskey);
}

/**
 * 更新 Passkey 计数器和最后使用时间
 */
export async function updatePasskeyCounter(
  db: D1Database,
  credentialId: string,
  counter: number
): Promise<void> {
  const now = Date.now();
  await db
    .prepare('UPDATE passkeys SET counter = ?, last_used_at = ? WHERE credential_id = ?')
    .bind(counter, now, credentialId)
    .run();
}

/**
 * 删除 Passkey
 */
export async function deletePasskey(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM passkeys WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  return result.success && (result.meta.changes || 0) > 0;
}

/**
 * 数据库行转 Passkey 对象
 */
function dbRowToPasskey(row: any): Passkey {
  return {
    id: row.id,
    user_id: row.user_id,
    credential_id: row.credential_id,
    public_key: row.public_key,
    counter: row.counter || 0,
    device_name: row.device_name,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  };
}

