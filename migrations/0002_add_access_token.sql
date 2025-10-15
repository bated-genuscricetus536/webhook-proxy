-- 添加 access_token 字段到 proxies 表
ALTER TABLE proxies ADD COLUMN access_token TEXT;

-- 为现有记录生成随机 token（如果有的话）
UPDATE proxies SET access_token = lower(hex(randomblob(16))) WHERE access_token IS NULL;

