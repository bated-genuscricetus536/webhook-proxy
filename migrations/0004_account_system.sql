-- migrations/0004_account_system.sql
-- 重构为完整的账户系统：支持密码登录 + OAuth/Passkey 绑定

-- 1. 修改 users 表，添加密码字段
ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT NULL;

-- 2. 修改 users 表，将 OAuth 相关字段改为可选
-- 注意：SQLite 不支持直接修改列约束，所以我们保持现有结构，但逻辑上这些字段变为可选

-- 3. 创建 OAuth 绑定表
CREATE TABLE IF NOT EXISTS oauth_bindings (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'github' 或 'gitlab'
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(platform, platform_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_bindings_user_id ON oauth_bindings (user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_bindings_platform ON oauth_bindings (platform, platform_user_id);

-- 4. 迁移现有 OAuth 数据到 oauth_bindings 表
-- 为所有现有用户创建对应的 oauth_binding 记录
INSERT INTO oauth_bindings (id, user_id, platform, platform_user_id, platform_username, access_token, refresh_token, created_at, updated_at)
SELECT 
  lower(hex(randomblob(16))),
  id as user_id,
  platform,
  platform_user_id,
  username as platform_username,
  access_token,
  refresh_token,
  created_at,
  updated_at
FROM users
WHERE platform IS NOT NULL AND platform_user_id IS NOT NULL;

-- 注意：我们保留 users 表中的 platform 等字段以保持向后兼容
-- 新系统将优先使用 oauth_bindings 表

