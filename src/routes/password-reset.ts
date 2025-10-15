import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { hashPassword } from '../utils/password.js';

// @ts-ignore
const passwordReset = new Hono<Env>();

/**
 * 请求密码重置（发送验证码到邮箱）
 */
passwordReset.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '无效的邮箱地址' }, 400);
    }
    
    // 查找用户
    const user = await (c.env as any).DB
      .prepare('SELECT id, username, email FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first();
    
    // 即使用户不存在，也返回成功（安全考虑，不泄露用户是否存在）
    if (!user) {
      console.log(`[Password Reset] User not found for email: ${email}`);
      return c.json({
        status: 'success',
        message: '如果该邮箱已注册，我们会向您发送验证码',
      });
    }
    
    // 生成 6 位验证码
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储重置码（有效期 10 分钟）
    await (c.env as any).SESSIONS.put(
      `password_reset:${email.toLowerCase()}`,
      JSON.stringify({
        code: resetCode,
        userId: user.id,
        timestamp: Date.now(),
      }),
      {
        expirationTtl: 600, // 10 分钟
      }
    );
    
    // 发送重置邮件
    const resendApiKey = (c.env as any).RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Password Reset] RESEND_API_KEY not configured');
      return c.json({ error: '邮件服务未配置' }, 500);
    }
    
    const emailSent = await sendPasswordResetEmail(
      email,
      resetCode,
      user.username,
      resendApiKey
    );
    
    if (!emailSent) {
      console.error('[Password Reset] Failed to send email to:', email);
      return c.json({ error: '邮件发送失败，请稍后重试' }, 500);
    }
    
    console.log(`[Password Reset] Reset code sent to: ${email}`);
    
    return c.json({
      status: 'success',
      message: '验证码已发送到您的邮箱，请查收（包括垃圾邮件箱）',
    });
  } catch (error) {
    console.error('[Password Reset] Forgot password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 重置密码（验证码 + 新密码）
 */
passwordReset.post('/reset-password', async (c) => {
  try {
    const { email, code, new_password } = await c.req.json<{
      email: string;
      code: string;
      new_password: string;
    }>();
    
    if (!email || !code || !new_password) {
      return c.json({ error: '缺少必要参数' }, 400);
    }
    
    if (code.length !== 6) {
      return c.json({ error: '无效的验证码' }, 400);
    }
    
    if (new_password.length < 8) {
      return c.json({ error: '密码至少需要 8 个字符' }, 400);
    }
    
    // 获取存储的重置信息
    const resetData = await (c.env as any).SESSIONS.get(
      `password_reset:${email.toLowerCase()}`
    );
    
    if (!resetData) {
      return c.json({ error: '验证码已过期或不存在' }, 400);
    }
    
    const { code: storedCode, userId } = JSON.parse(resetData);
    
    // 验证码比对
    if (code !== storedCode) {
      return c.json({ error: '验证码错误' }, 400);
    }
    
    // 更新密码
    const newPasswordHash = await hashPassword(new_password);
    await (c.env as any).DB
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, Date.now(), userId)
      .run();
    
    // 删除重置码
    await (c.env as any).SESSIONS.delete(`password_reset:${email.toLowerCase()}`);
    
    console.log(`[Password Reset] Password reset successful for user: ${userId}`);
    
    return c.json({
      status: 'success',
      message: '密码重置成功，请使用新密码登录',
    });
  } catch (error) {
    console.error('[Password Reset] Reset password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default passwordReset;

