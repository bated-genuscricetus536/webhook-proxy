/**
 * TOTP (Time-based One-Time Password) 工具函数
 */
import { TOTP, Secret } from 'otpauth';

/**
 * 生成 TOTP secret
 */
export function generateTOTPSecret(username: string): { secret: string; uri: string } {
  const secret = new Secret();
  const totp = new TOTP({
    issuer: 'Webhook Proxy',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

/**
 * 验证 TOTP 令牌
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });

    const delta = totp.validate({
      token,
      window: 1, // 允许前后1个时间窗口（±30秒）
    });

    return delta !== null;
  } catch (error) {
    console.error('[TOTP] Verification error:', error);
    return false;
  }
}

