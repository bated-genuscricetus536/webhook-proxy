-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL, -- 'github' or 'gitlab'
    platform_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(platform, platform_user_id)
);

-- Webhook Proxies 表
CREATE TABLE IF NOT EXISTS proxies (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'github' or 'gitlab'
    random_key TEXT NOT NULL UNIQUE,
    webhook_secret TEXT,
    verify_signature INTEGER DEFAULT 1, -- boolean: 0 or 1
    active INTEGER DEFAULT 1, -- boolean: 0 or 1
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_event_at INTEGER,
    event_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform, platform_user_id);
CREATE INDEX IF NOT EXISTS idx_proxies_user_id ON proxies(user_id);
CREATE INDEX IF NOT EXISTS idx_proxies_random_key ON proxies(random_key);
CREATE INDEX IF NOT EXISTS idx_proxies_platform ON proxies(platform);

-- Webhook 事件日志表（可选，用于调试和统计）
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    proxy_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (proxy_id) REFERENCES proxies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_proxy_id ON webhook_events(proxy_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON webhook_events(created_at);

