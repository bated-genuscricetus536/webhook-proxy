-- 重置数据库：删除所有表并重新创建

-- 删除所有表（按依赖顺序）
DROP TABLE IF EXISTS passkeys;
DROP TABLE IF EXISTS oauth_bindings;
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS proxies;
DROP TABLE IF EXISTS users;

-- 重新创建 users 表
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

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_email ON users (email);

-- 重新创建 proxies 表
CREATE TABLE proxies (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  random_key TEXT UNIQUE NOT NULL,
  access_token TEXT,
  webhook_secret TEXT,
  verify_signature INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_event_at INTEGER,
  event_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_proxies_user_id ON proxies (user_id);
CREATE INDEX idx_proxies_random_key ON proxies (random_key);

-- 重新创建 oauth_bindings 表
CREATE TABLE oauth_bindings (
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

CREATE INDEX idx_oauth_bindings_user_id ON oauth_bindings (user_id);
CREATE INDEX idx_oauth_bindings_platform ON oauth_bindings (platform, platform_user_id);

-- 重新创建 passkeys 表
CREATE TABLE passkeys (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  device_name TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_passkeys_user_id ON passkeys (user_id);
CREATE INDEX idx_passkeys_credential_id ON passkeys (credential_id);

-- 重新创建 webhook_events 表
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY NOT NULL,
  proxy_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  headers TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE
);

CREATE INDEX idx_webhook_events_proxy_id ON webhook_events (proxy_id);
CREATE INDEX idx_webhook_events_created_at ON webhook_events (created_at);

