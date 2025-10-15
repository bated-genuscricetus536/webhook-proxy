/**
 * Ed25519 签名验证工具
 * 用于 QQ Bot Webhook 签名校验
 * 
 * 参考：
 * - https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#webhook%E6%96%B9%E5%BC%8F
 * - https://github.com/zhinjs/qq-official-bot/blob/master/src/receivers/webhook.ts
 * 
 * QQ Bot 公钥获取：
 * 1. 登录 QQ 开放平台：https://q.qq.com/#/app/bot
 * 2. 选择机器人 → 开发设置
 * 3. 复制 "公钥"（hex 格式的 Ed25519 公钥）
 */

/**
 * 验证 Ed25519 签名
 * @param message 原始消息
 * @param signature 签名（hex 编码）
 * @param publicKey 公钥（hex 编码，从 QQ 开放平台获取）
 * @returns 签名是否有效
 */
export async function verifyEd25519(
  message: string | Uint8Array,
  signature: string,
  publicKey: string
): Promise<boolean> {
  try {
    // 转换输入
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    const signatureBytes = hexToBytes(signature);
    const publicKeyBytes = hexToBytes(publicKey);
    
    // Ed25519 公钥应该是 32 字节
    if (publicKeyBytes.length !== 32) {
      console.error('[Ed25519] Invalid public key length:', publicKeyBytes.length, 'expected 32');
      return false;
    }
    
    // Ed25519 签名应该是 64 字节
    if (signatureBytes.length !== 64) {
      console.error('[Ed25519] Invalid signature length:', signatureBytes.length, 'expected 64');
      return false;
    }
    
    // 导入公钥
    // 注意：Cloudflare Workers 的 crypto.subtle 支持 Ed25519
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519',
      },
      false,
      ['verify']
    );
    
    // 验证签名
    const isValid = await crypto.subtle.verify(
      'Ed25519',
      cryptoKey,
      signatureBytes,
      messageBytes
    );
    
    return isValid;
  } catch (error) {
    console.error('[Ed25519] Verification error:', error);
    return false;
  }
}

/**
 * 将 hex 字符串转换为 Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  // 移除可能的 0x 前缀
  hex = hex.replace(/^0x/, '');
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * 将 Uint8Array 转换为 hex 字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 验证 QQ Bot Webhook 签名
 * @param body 请求体（字符串）
 * @param timestamp 时间戳（X-Signature-Timestamp header）
 * @param signature 签名（X-Signature-Ed25519 header）
 * @param publicKey 公钥（从 QQ Bot 开放平台获取）
 * @returns 签名是否有效
 */
export async function verifyQQBotSignature(
  body: string,
  timestamp: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  // QQ Bot 签名验证算法：
  // 1. 将 timestamp + body 拼接成待签名字符串
  // 2. 使用 Ed25519 验证签名
  const message = timestamp + body;
  return verifyEd25519(message, signature, publicKey);
}

