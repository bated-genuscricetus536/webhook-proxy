-- migrations/0006_add_email_verification.sql

-- 添加 email 验证状态字段
ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0;

