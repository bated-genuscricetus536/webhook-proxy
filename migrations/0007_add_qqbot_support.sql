-- Migration: 添加 QQ Bot 支持
-- Created: 2025-10-15

-- 1. 添加 platform_app_id 字段（用于存储 QQ Bot App ID 等平台特定 ID）
ALTER TABLE proxies ADD COLUMN platform_app_id TEXT;

-- 2. 创建索引以优化 QQ Bot 查询
CREATE INDEX IF NOT EXISTS idx_proxies_platform_app_id ON proxies(platform_app_id);

-- 注释：
-- platform_app_id 用于存储平台特定的应用 ID
-- 对于 QQ Bot：存储 Bot 的 App ID
-- 对于 GitHub/GitLab：可以为 NULL 或存储其他标识符

