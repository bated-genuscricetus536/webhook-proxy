-- migrations/0005_complete_account_refactor.sql
-- 完整重构账户系统：移除 users 表的 OAuth 字段

-- 1. 先确保 oauth_bindings 表存在
CREATE TABLE IF NOT EXISTS oauth_bindings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_bindings_user_id ON oauth_bindings (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_bindings_platform ON oauth_bindings (platform, platform_user_id);

-- 2. 迁移现有 OAuth 数据到 oauth_bindings 表（如果还没有）
INSERT OR IGNORE INTO oauth_bindings (id, user_id, platform, platform_user_id, platform_username, access_token, refresh_token, created_at)
SELECT 
  lower(hex(randomblob(16))),
  id as user_id,
  platform,
  platform_user_id,
  username as platform_username,
  access_token,
  COALESCE(refresh_token, ''),
  created_at
FROM users
WHERE platform IS NOT NULL AND platform_user_id IS NOT NULL AND access_token IS NOT NULL;

-- 3. 重建 users 表（移除 OAuth 字段）
-- SQLite 不支持直接删除列，所以需要重建表
ALTER TABLE users RENAME TO users_old;

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  avatar_url TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  mfa_secret TEXT,
  passkey_enabled INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 4. 迁移数据到新表
INSERT INTO users (id, username, email, password_hash, avatar_url, mfa_enabled, mfa_secret, passkey_enabled, created_at, updated_at)
SELECT 
  id,
  username,
  email,
  password_hash,
  avatar_url,
  COALESCE(mfa_enabled, 0),
  mfa_secret,
  COALESCE(passkey_enabled, 0),
  created_at,
  updated_at
FROM users_old;

-- 5. 删除旧表
DROP TABLE users_old;

-- 6. 重建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

