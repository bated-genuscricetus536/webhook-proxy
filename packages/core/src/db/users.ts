import { nanoid } from 'nanoid';
import { User } from '../types/index.js';
import { hashPassword } from '../utils/password.js';

/**
 * 用户数据库操作
 */

export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();
  
  return result ? dbRowToUser(result) : null;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first();
  
  return result ? dbRowToUser(result) : null;
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE username = ?')
    .bind(username.toLowerCase())
    .first();
  
  return result ? dbRowToUser(result) : null;
}

/**
 * 数据库行转 User 对象
 */
function dbRowToUser(row: any): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    email_verified: Boolean(row.email_verified),
    password_hash: row.password_hash,
    avatar_url: row.avatar_url,
    mfa_enabled: Boolean(row.mfa_enabled),
    mfa_secret: row.mfa_secret,
    passkey_enabled: Boolean(row.passkey_enabled),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * 创建用户（密码注册）
 */
export async function createUserWithPassword(
  db: D1Database,
  username: string,
  email: string,
  password: string
): Promise<User> {
  const now = Date.now();
  const passwordHash = await hashPassword(password);
  
  const user: User = {
    id: nanoid(),
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    email_verified: false,
    password_hash: passwordHash,
    avatar_url: null,
    mfa_enabled: false,
    mfa_secret: null,
    passkey_enabled: false,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(`
      INSERT INTO users (
        id, username, email, email_verified, password_hash, avatar_url,
        mfa_enabled, mfa_secret, passkey_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      user.id,
      user.username,
      user.email,
      0, // email_verified
      user.password_hash,
      user.avatar_url,
      0, // mfa_enabled
      null, // mfa_secret
      0, // passkey_enabled
      user.created_at,
      user.updated_at
    )
    .run();

  return user;
}

/**
 * 创建用户（OAuth 首次登录时创建基础用户）
 */
export async function createUser(
  db: D1Database,
  username: string,
  email: string | null,
  avatar_url: string | null
): Promise<User> {
  const now = Date.now();
  const user: User = {
    id: nanoid(),
    username: username.toLowerCase(),
    email: email ? email.toLowerCase() : null,
    email_verified: !!email, // OAuth 提供的 email 视为已验证
    password_hash: null,
    avatar_url: avatar_url,
    mfa_enabled: false,
    mfa_secret: null,
    passkey_enabled: false,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(`
      INSERT INTO users (
        id, username, email, email_verified, password_hash, avatar_url,
        mfa_enabled, mfa_secret, passkey_enabled,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      user.id,
      user.username,
      user.email,
      user.email_verified ? 1 : 0,
      user.password_hash,
      user.avatar_url,
      0, // mfa_enabled
      null, // mfa_secret
      0, // passkey_enabled
      user.created_at,
      user.updated_at
    )
    .run();

  return user;
}

export async function updateUser(
  db: D1Database,
  userId: string,
  updates: Partial<Pick<User, 'username' | 'email' | 'avatar_url' | 'password_hash'>>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.username !== undefined) {
    fields.push('username = ?');
    values.push(updates.username);
  }
  if (updates.email !== undefined) {
    fields.push('email = ?');
    values.push(updates.email);
  }
  if (updates.avatar_url !== undefined) {
    fields.push('avatar_url = ?');
    values.push(updates.avatar_url);
  }
  if (updates.password_hash !== undefined) {
    fields.push('password_hash = ?');
    values.push(updates.password_hash);
  }

  fields.push('updated_at = ?');
  values.push(Date.now());

  values.push(userId);

  await db
    .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteUser(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare('DELETE FROM users WHERE id = ?')
    .bind(userId)
    .run();
}

/**
 * 更新用户 MFA 设置
 */
export async function updateUserMFA(
  db: D1Database,
  userId: string,
  mfaEnabled: boolean,
  mfaSecret: string | null
): Promise<void> {
  await db
    .prepare('UPDATE users SET mfa_enabled = ?, mfa_secret = ?, updated_at = ? WHERE id = ?')
    .bind(mfaEnabled ? 1 : 0, mfaSecret, Date.now(), userId)
    .run();
}

/**
 * 更新用户 Passkey 设置
 */
export async function updateUserPasskey(
  db: D1Database,
  userId: string,
  passkeyEnabled: boolean
): Promise<void> {
  await db
    .prepare('UPDATE users SET passkey_enabled = ?, updated_at = ? WHERE id = ?')
    .bind(passkeyEnabled ? 1 : 0, Date.now(), userId)
    .run();
}
