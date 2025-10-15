import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { getUserById } from '../db/users.js';
import { getBindingsByUserId, deleteBinding } from '../db/oauth-bindings.js';
import { verifyPassword, hashPassword, validatePasswordStrength } from '../utils/password.js';
import { generateState } from '../auth/oauth.js';
import { sendVerificationEmail } from '../utils/email.js';

// @ts-ignore
const accountSettings = new Hono<Env>();

// 所有路由都需要认证
accountSettings.use('*', authMiddleware as any);

/**
 * 获取账户设置信息
 */
accountSettings.get('/', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 获取所有 OAuth 绑定
    const oauthBindings = await getBindingsByUserId((c.env as any).DB, userId);
    
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        email_verified: user.email_verified,
        avatar_url: user.avatar_url,
        has_password: !!user.password_hash,
        created_at: user.created_at,
      },
      oauth_bindings: oauthBindings.map(binding => ({
        id: binding.id,
        platform: binding.platform,
        platform_username: binding.platform_username,
        created_at: binding.created_at,
      })),
    });
  } catch (error) {
    console.error('[AccountSettings] Get settings error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 发起 OAuth 绑定（返回授权 URL）
 */
accountSettings.post('/bind-oauth/:platform', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const platform = c.req.param('platform') as 'github' | 'gitlab';
    
    if (platform !== 'github' && platform !== 'gitlab') {
      return c.json({ error: 'Invalid platform' }, 400);
    }
    
    // 生成 state
    const state = generateState();
    const url = new URL(c.req.url);
    const redirectUri = `${url.origin}/auth/${platform}/callback`;
    
    // 存储 state（绑定模式）
    await (c.env as any).SESSIONS.put(`oauth_state:${state}`, JSON.stringify({
      platform,
      mode: 'bind',
      userId,
    }), {
      expirationTtl: 300,
    });
    
    // 构造授权 URL
    const { createOAuthProvider } = await import('../auth/oauth.js');
    const provider = createOAuthProvider(platform, c.env as any);
    const authUrl = provider.getAuthUrl(state, redirectUri);
    
    return c.json({
      auth_url: authUrl,
    });
  } catch (error) {
    console.error('[AccountSettings] Bind OAuth error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 解绑 OAuth 账号
 */
accountSettings.delete('/oauth-binding/:id', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const bindingId = c.req.param('id');
    
    // 获取所有绑定
    const bindings = await getBindingsByUserId((c.env as any).DB, userId);
    const binding = bindings.find(b => b.id === bindingId);
    
    if (!binding) {
      return c.json({ error: 'Binding not found' }, 404);
    }
    
    // 检查是否是最后一种登录方式
    const user = await getUserById((c.env as any).DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 至少要保留一种登录方式
    const hasPassword = !!user.password_hash;
    const hasPasskey = user.passkey_enabled;
    const oauthCount = bindings.length;
    
    if (!hasPassword && !hasPasskey && oauthCount <= 1) {
      return c.json({ 
        error: '无法解绑：这是您唯一的登录方式。请先设置密码或绑定其他登录方式。' 
      }, 400);
    }
    
    // 删除绑定
    await deleteBinding((c.env as any).DB, bindingId);
    
    return c.json({ status: 'success', message: 'OAuth binding removed' });
  } catch (error) {
    console.error('[AccountSettings] Unbind OAuth error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 修改密码
 */
accountSettings.post('/change-password', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const { current_password, new_password } = await c.req.json<{
      current_password?: string;
      new_password: string;
    }>();
    
    if (!new_password) {
      return c.json({ error: '新密码为必填项' }, 400);
    }
    
    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(new_password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.errors.join('; ') }, 400);
    }
    
    const user = await getUserById((c.env as any).DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 如果用户已经有密码，需要验证当前密码
    if (user.password_hash) {
      if (!current_password) {
        return c.json({ error: '请输入当前密码' }, 400);
      }
      
      const isValid = await verifyPassword(current_password, user.password_hash);
      if (!isValid) {
        return c.json({ error: '当前密码错误' }, 401);
      }
    }
    
    // 更新密码
    const newPasswordHash = await hashPassword(new_password);
    await (c.env as any).DB
      .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(newPasswordHash, Date.now(), userId)
      .run();
    
    return c.json({ 
      status: 'success', 
      message: user.password_hash ? '密码修改成功' : '密码设置成功' 
    });
  } catch (error) {
    console.error('[AccountSettings] Change password error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 发送邮箱验证码
 */
accountSettings.post('/send-verification-code', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const { email } = await c.req.json<{ email: string }>();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '无效的邮箱地址' }, 400);
    }
    
    // 获取用户信息（用于邮件中显示用户名）
    const user = await getUserById((c.env as any).DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 生成 6 位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储验证码（有效期 10 分钟）
    await (c.env as any).SESSIONS.put(
      `email_verification:${userId}`,
      JSON.stringify({
        email: email.toLowerCase(),
        code: verificationCode,
        timestamp: Date.now(),
      }),
      {
        expirationTtl: 600, // 10 分钟
      }
    );
    
    // 发送验证邮件
    const resendApiKey = (c.env as any).RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Email Verification] RESEND_API_KEY not configured');
      return c.json({ error: '邮件服务未配置' }, 500);
    }
    
    const emailSent = await sendVerificationEmail(
      email,
      verificationCode,
      user.username,
      resendApiKey
    );
    
    if (!emailSent) {
      console.error('[Email Verification] Failed to send email to:', email);
      // 即使邮件发送失败，也返回成功（验证码已存储，用户可以查看日志）
      // 在开发环境中，我们仍然返回 debug_code
    }
    
    console.log(`[Email Verification] Code for ${email}: ${verificationCode}`);
    
    // 检查是否是开发环境
    const isDevelopment = (c.env as any).ENVIRONMENT === 'development';
    
    return c.json({
      status: 'success',
      message: '验证码已发送到您的邮箱',
      // 仅在开发环境返回验证码
      ...(isDevelopment ? { debug_code: verificationCode } : {}),
    });
  } catch (error) {
    console.error('[AccountSettings] Send verification code error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 验证邮箱并更新
 */
accountSettings.post('/verify-email', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const { code } = await c.req.json<{ code: string }>();
    
    if (!code || code.length !== 6) {
      return c.json({ error: '无效的验证码' }, 400);
    }
    
    // 获取存储的验证信息
    const verificationData = await (c.env as any).SESSIONS.get(`email_verification:${userId}`);
    if (!verificationData) {
      return c.json({ error: '验证码已过期或不存在' }, 400);
    }
    
    const { email, code: storedCode } = JSON.parse(verificationData);
    
    // 验证码比对
    if (code !== storedCode) {
      return c.json({ error: '验证码错误' }, 400);
    }
    
    // 更新用户 email 和验证状态
    await (c.env as any).DB
      .prepare('UPDATE users SET email = ?, email_verified = 1, updated_at = ? WHERE id = ?')
      .bind(email, Date.now(), userId)
      .run();
    
    // 删除验证码
    await (c.env as any).SESSIONS.delete(`email_verification:${userId}`);
    
    return c.json({
      status: 'success',
      message: '邮箱验证成功',
    });
  } catch (error) {
    console.error('[AccountSettings] Verify email error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 直接更新 email（不验证 - 用于已有 email 的用户修改）
 */
accountSettings.post('/update-email', async (c) => {
  try {
    const userId = (c as any).get('userId');
    const { email } = await c.req.json<{ email: string }>();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '无效的邮箱地址' }, 400);
    }
    
    // 检查邮箱是否已被使用
    const existingUser = await (c.env as any).DB
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .bind(email.toLowerCase(), userId)
      .first();
    
    if (existingUser) {
      return c.json({ error: '该邮箱已被其他用户使用' }, 400);
    }
    
    // 更新 email，设置为未验证
    await (c.env as any).DB
      .prepare('UPDATE users SET email = ?, email_verified = 0, updated_at = ? WHERE id = ?')
      .bind(email.toLowerCase(), Date.now(), userId)
      .run();
    
    return c.json({
      status: 'success',
      message: '邮箱已更新，请进行验证',
    });
  } catch (error) {
    console.error('[AccountSettings] Update email error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default accountSettings;

