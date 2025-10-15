/**
 * 安全设置相关路由（MFA 和 Passkey）
 */
import { Hono } from 'hono';
import { Env } from '../types/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { getUserById, updateUserMFA, updateUserPasskey } from '../db/users.js';
import { generateTOTPSecret, verifyTOTPToken } from '../auth/totp.js';
import {
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyAuthentication,
} from '../auth/webauthn.js';
import {
  createPasskey,
  getPasskeyByCredentialId,
  getPasskeysByUserId,
  updatePasskeyCounter,
  deletePasskey,
} from '../db/passkeys.js';
import { getProxiesByUserId } from '../db/proxies.js';

// @ts-ignore
const security = new Hono<Env>();

/**
 * 获取安全设置状态（需要认证）
 */
security.get('/settings', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      mfa_enabled: user.mfa_enabled,
      passkey_enabled: user.passkey_enabled,
      has_passkeys: user.passkey_enabled,
    });
  } catch (error) {
    console.error('[Security] Get settings error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 生成 MFA 设置（返回 QR 码数据）（需要认证）
 */
security.post('/mfa/setup', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // 生成新的 TOTP secret
    const { secret, uri } = generateTOTPSecret(user.username);

    // 暂存 secret（用户验证后才真正启用）
    await (c.env as any).SESSIONS.put(`mfa_setup:${userId}`, secret, {
      expirationTtl: 600, // 10分钟有效期
    });

    return c.json({
      secret,
      qr_uri: uri,
      message: 'Please scan the QR code with your authenticator app and verify with a token',
    });
  } catch (error) {
    console.error('[Security] MFA setup error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 验证并启用 MFA（需要认证）
 */
security.post('/mfa/verify', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const body = await c.req.json();
    const { token } = body;

    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    // 获取临时存储的 secret
    const secret = await (c.env as any).SESSIONS.get(`mfa_setup:${userId}`);
    if (!secret) {
      return c.json({ error: 'MFA setup not found or expired' }, 400);
    }

    // 验证 token
    if (!verifyTOTPToken(secret, token)) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // 启用 MFA
    await updateUserMFA((c.env as any).DB, userId, true, secret);

    // 清理临时数据
    await (c.env as any).SESSIONS.delete(`mfa_setup:${userId}`);

    return c.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('[Security] MFA verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 禁用 MFA（需要认证）
 */
security.post('/mfa/disable', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const body = await c.req.json();
    const { token } = body;

    const user = await getUserById((c.env as any).DB, userId);
    if (!user || !user.mfa_enabled || !user.mfa_secret) {
      return c.json({ error: 'MFA is not enabled' }, 400);
    }

    // 验证 token
    if (!verifyTOTPToken(user.mfa_secret, token)) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    // 禁用 MFA
    await updateUserMFA((c.env as any).DB, userId, false, null);

    return c.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('[Security] MFA disable error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 获取 Passkey 注册选项（需要认证）
 */
security.post('/passkey/register/options', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const url = new URL(c.req.url);
    const rpID = url.hostname;

    const options = await generatePasskeyRegistrationOptions(
      userId,
      user.username,
      rpID
    );

    // 存储 challenge 用于后续验证
    await (c.env as any).SESSIONS.put(
      `passkey_challenge:${userId}`,
      options.challenge,
      { expirationTtl: 300 }
    );

    return c.json(options);
  } catch (error) {
    console.error('[Security] Passkey register options error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 验证 Passkey 注册（需要认证）
 */
security.post('/passkey/register/verify', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const body = await c.req.json();
    const { response, device_name } = body;

    // 获取 challenge
    const expectedChallenge = await (c.env as any).SESSIONS.get(
      `passkey_challenge:${userId}`
    );
    if (!expectedChallenge) {
      return c.json({ error: 'Challenge not found or expired' }, 400);
    }

    const url = new URL(c.req.url);
    const expectedOrigin = url.origin;
    const expectedRPID = url.hostname;

    // 验证注册响应
    const verification = await verifyPasskeyRegistration(
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID
    );

    if (!verification.verified || !verification.registrationInfo) {
      return c.json({ error: 'Verification failed' }, 401);
    }

    // 存储 Passkey (v13 API)
    const { credential } = verification.registrationInfo;
    
    // credential.id 已经是 base64 字符串
    // credential.publicKey 是 Uint8Array，需要转换为 base64
    const publicKeyBase64 = btoa(String.fromCharCode(...credential.publicKey));
    
    await createPasskey(
      (c.env as any).DB,
      userId,
      credential.id,
      publicKeyBase64,
      device_name || null
    );

    // 启用 Passkey
    await updateUserPasskey((c.env as any).DB, userId, true);

    // 清理 challenge
    await (c.env as any).SESSIONS.delete(`passkey_challenge:${userId}`);

    return c.json({ message: 'Passkey registered successfully' });
  } catch (error) {
    console.error('[Security] Passkey register verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 获取用户的所有 Passkeys（需要认证）
 */
security.get('/passkeys', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const passkeys = await getPasskeysByUserId((c.env as any).DB, userId);

    return c.json({
      passkeys: passkeys.map(pk => ({
        id: pk.id,
        device_name: pk.device_name || 'Unknown Device',
        created_at: pk.created_at,
        last_used_at: pk.last_used_at,
      })),
    });
  } catch (error) {
    console.error('[Security] List passkeys error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 删除 Passkey（需要认证）
 */
security.delete('/passkeys/:id', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const passkeyId = c.req.param('id');

    const success = await deletePasskey((c.env as any).DB, passkeyId, userId);
    if (!success) {
      return c.json({ error: 'Passkey not found' }, 404);
    }

    // 检查是否还有其他 Passkeys
    const remainingPasskeys = await getPasskeysByUserId((c.env as any).DB, userId);
    if (remainingPasskeys.length === 0) {
      // 如果没有 Passkey 了，禁用 Passkey 功能
      await updateUserPasskey((c.env as any).DB, userId, false);
    }

    return c.json({ message: 'Passkey deleted successfully' });
  } catch (error) {
    console.error('[Security] Delete passkey error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 验证 MFA/Passkey 并返回 secrets（需要认证）
 */
security.post('/verify-and-show-secrets', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const body = await c.req.json();
    const { method, token, response } = body;

    const user = await getUserById((c.env as any).DB, userId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    let verified = false;

    // 验证 MFA
    if (method === 'mfa') {
      if (!user.mfa_enabled || !user.mfa_secret) {
        return c.json({ error: 'MFA is not enabled' }, 400);
      }
      verified = verifyTOTPToken(user.mfa_secret, token);
    }
    // 验证 Passkey
    else if (method === 'passkey') {
      if (!user.passkey_enabled) {
        return c.json({ error: 'Passkey is not enabled' }, 400);
      }

      const expectedChallenge = await (c.env as any).SESSIONS.get(
        `passkey_auth:${userId}`
      );
      if (!expectedChallenge) {
        return c.json({ error: 'Challenge not found or expired' }, 400);
      }

      const url = new URL(c.req.url);
      const expectedOrigin = url.origin;
      const expectedRPID = url.hostname;

      // 获取凭证
      const passkey = await getPasskeyByCredentialId(
        (c.env as any).DB,
        response.id
      );
      if (!passkey) {
        return c.json({ error: 'Passkey not found' }, 404);
      }

      // 转换 base64 为 Uint8Array（不使用 Buffer）
      const base64ToUint8Array = (base64: string): Uint8Array => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      };

      const verification = await verifyPasskeyAuthentication(
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        {
          id: passkey.credential_id, // 已经是 base64 字符串
          publicKey: base64ToUint8Array(passkey.public_key),
          counter: passkey.counter,
        }
      );

      verified = verification.verified;

      if (verified && verification.authenticationInfo) {
        // 更新计数器
        await updatePasskeyCounter(
          (c.env as any).DB,
          passkey.credential_id,
          verification.authenticationInfo.newCounter
        );
      }

      // 清理 challenge
      await (c.env as any).SESSIONS.delete(`passkey_auth:${userId}`);
    }

    if (!verified) {
      return c.json({ error: 'Verification failed' }, 401);
    }

    // 获取所有 proxies 的 secrets
    const proxies = await getProxiesByUserId((c.env as any).DB, userId);
    const secrets = proxies.map(proxy => ({
      id: proxy.id,
      access_token: proxy.access_token,
      webhook_secret: proxy.webhook_secret,
    }));

    return c.json({ secrets });
  } catch (error) {
    console.error('[Security] Verify and show secrets error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * 获取 Passkey 认证选项（用于查看 secrets）（需要认证）
 */
security.post('/passkey/auth/options', authMiddleware as any, async (c) => {
  try {
    const userId = (c as any).get('userId');
    const user = await getUserById((c.env as any).DB, userId);

    if (!user || !user.passkey_enabled) {
      return c.json({ error: 'Passkey is not enabled' }, 400);
    }

    const url = new URL(c.req.url);
    const rpID = url.hostname;

    const passkeys = await getPasskeysByUserId((c.env as any).DB, userId);
    
    // credentialID 已经是 base64 字符串，simplewebauthn v9 接受字符串
    const allowCredentials = passkeys.map(pk => ({
      id: pk.credential_id,
      type: 'public-key' as const,
    }));

    const options = await generatePasskeyAuthenticationOptions(
      rpID,
      allowCredentials
    );

    // 存储 challenge
    await (c.env as any).SESSIONS.put(
      `passkey_auth:${userId}`,
      options.challenge,
      { expirationTtl: 300 }
    );

    return c.json(options);
  } catch (error) {
    console.error('[Security] Passkey auth options error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Passkey 登录：获取认证选项（无需登录）
 */
security.post('/passkey/login/options', async (c) => {
  try {
    const url = new URL(c.req.url);
    const rpID = url.hostname;

    // 生成认证选项（允许所有已注册的 Passkey）
    const options = await generatePasskeyAuthenticationOptions(rpID);

    // 存储 challenge（使用临时 ID，因为用户还未登录）
    const tempId = `login_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await (c.env as any).SESSIONS.put(
      `passkey_login_challenge:${tempId}`,
      options.challenge,
      { expirationTtl: 300 }
    );

    // 将 tempId 存储在 challenge 中，供后续验证使用
    await (c.env as any).SESSIONS.put(
      `passkey_login_temp:${options.challenge}`,
      tempId,
      { expirationTtl: 300 }
    );

    return c.json(options);
  } catch (error) {
    console.error('[Security] Passkey login options error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Passkey 登录：验证认证响应并创建 session（无需登录）
 */
security.post('/passkey/login/verify', async (c) => {
  try {
    const { response } = await c.req.json();

    if (!response || !response.id) {
      return c.json({ error: 'Invalid response' }, 400);
    }

    const url = new URL(c.req.url);
    const expectedOrigin = url.origin;
    const expectedRPID = url.hostname;

    // 从响应中提取 challenge（base64url 格式）
    const clientDataJSON = JSON.parse(
      atob(response.response.clientDataJSON.replace(/-/g, '+').replace(/_/g, '/'))
    );
    const challengeFromResponse = clientDataJSON.challenge;

    // 获取存储的 tempId
    const tempId = await (c.env as any).SESSIONS.get(`passkey_login_temp:${challengeFromResponse}`);
    if (!tempId) {
      return c.json({ error: 'Challenge expired or not found' }, 400);
    }

    // 获取存储的 challenge
    const expectedChallenge = await (c.env as any).SESSIONS.get(`passkey_login_challenge:${tempId}`);
    if (!expectedChallenge) {
      return c.json({ error: 'Challenge expired or not found' }, 400);
    }

    // 根据 credential ID 查找 Passkey
    const passkey = await getPasskeyByCredentialId((c.env as any).DB, response.id);
    if (!passkey) {
      return c.json({ error: 'Passkey not found' }, 404);
    }

    // 获取用户信息
    const user = await getUserById((c.env as any).DB, passkey.user_id);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // 验证 Passkey
    const base64ToUint8Array = (base64: string): Uint8Array => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    };

    let verified = false;
    try {
      const verification = await verifyPasskeyAuthentication(
        response,
        expectedChallenge,
        expectedOrigin,
        expectedRPID,
        {
          id: passkey.credential_id,
          publicKey: base64ToUint8Array(passkey.public_key),
          counter: passkey.counter,
        }
      );

      verified = verification.verified;

      if (verified && verification.authenticationInfo) {
        // 更新计数器
        await updatePasskeyCounter((c.env as any).DB, passkey.id, verification.authenticationInfo.newCounter);
      }
    } catch (e) {
      console.error('Passkey login verification error:', e);
      verified = false;
    } finally {
      // 清理临时数据
      await (c.env as any).SESSIONS.delete(`passkey_login_challenge:${tempId}`);
      await (c.env as any).SESSIONS.delete(`passkey_login_temp:${challengeFromResponse}`);
    }

    if (!verified) {
      return c.json({ error: 'Passkey authentication failed' }, 401);
    }

    // 认证成功，创建 session
    const { generateSessionToken } = await import('../auth/oauth.js');
    const sessionToken = await generateSessionToken(user.id, (c.env as any).SESSION_SECRET);

    // 返回 session token
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
    console.error('[Security] Passkey login verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default security;

