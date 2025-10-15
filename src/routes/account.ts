import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { createUserWithPassword, getUserByEmail, getUserByUsername } from '../db/users.js';
import { verifyPassword, validatePasswordStrength } from '../utils/password.js';
import { generateSessionToken } from '../auth/oauth.js';

// @ts-ignore
const account = new Hono<Env>();

/**
 * 用户注册
 */
account.post('/register', async (c) => {
  try {
    const { username, email, password } = await c.req.json<{
      username: string;
      email: string;
      password: string;
    }>();

    // 验证输入
    if (!username || !email || !password) {
      return c.json({ error: '用户名、邮箱和密码为必填项' }, 400);
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return c.json({ error: '用户名必须为 3-20 个字符，只能包含字母、数字、下划线和连字符' }, 400);
    }

    // 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '邮箱格式不正确' }, 400);
    }

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return c.json({ error: passwordValidation.errors.join('; ') }, 400);
    }

    // 检查用户名是否已存在
    const existingUsername = await getUserByUsername((c.env as any).DB, username);
    if (existingUsername) {
      return c.json({ error: '用户名已被使用' }, 409);
    }

    // 检查邮箱是否已存在
    const existingEmail = await getUserByEmail((c.env as any).DB, email);
    if (existingEmail) {
      return c.json({ error: '邮箱已被注册' }, 409);
    }

    // 创建用户
    const user = await createUserWithPassword((c.env as any).DB, username, email, password);

    // 创建 session
    const sessionToken = await generateSessionToken(user.id, (c.env as any).SESSION_SECRET);

    return c.json({
      status: 'success',
      session_token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    }, 201);
  } catch (error) {
    console.error('[Account] Register error:', error);
    return c.json({ error: '注册失败，请稍后重试' }, 500);
  }
});

/**
 * 密码登录
 */
account.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json<{
      username: string; // 可以是用户名或邮箱
      password: string;
    }>();

    if (!username || !password) {
      return c.json({ error: '用户名和密码为必填项' }, 400);
    }

    // 尝试通过用户名或邮箱查找用户
    let user = await getUserByUsername((c.env as any).DB, username);
    if (!user && username.includes('@')) {
      user = await getUserByEmail((c.env as any).DB, username);
    }

    if (!user || !user.password_hash) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: '用户名或密码错误' }, 401);
    }

    // 创建 session
    const sessionToken = await generateSessionToken(user.id, (c.env as any).SESSION_SECRET);

    return c.json({
      status: 'success',
      session_token: sessionToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('[Account] Login error:', error);
    return c.json({ error: '登录失败，请稍后重试' }, 500);
  }
});

export default account;

