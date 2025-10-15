/**
 * Ed25519 签名验证工具
 * 用于 QQ Bot Webhook 签名验证
 * 
 * 参考：
 * - https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#webhook%E6%96%B9%E5%BC%8F
 * - https://github.com/zhinjs/qq-official-bot
 * - TweetNaCl.js Ed25519 实现
 * 
 * QQ Bot 签名机制：
 * 1. OpCode 13（回调验证）：签名 event_ts + plain_token 并返回
 * 2. OpCode 0（事件推送）：验证 QQ Bot 发来的签名（timestamp + body）
 * 3. 签名算法：Ed25519，使用 App Secret 派生密钥对
 * 
 * 密钥派生规则：
 * - 将 secret 重复填充到至少 32 字节
 * - 截取前 32 字节作为种子
 * - 使用种子生成 Ed25519 密钥对
 */

/**
 * 将 hex 字符串转换为 Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  hex = hex.replace(/^0x/, '').trim();
  
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 将 Uint8Array 转换为 hex 字符串
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 从 App Secret 派生出 32 字节的种子
 * 这是 QQ Bot 的约定：重复填充到至少 32 字节，然后截取前 32 字节
 * 
 * @param secret - App Secret 字符串
 * @returns 32 字节种子
 */
function deriveSeed(secret: string): Uint8Array {
  let finalSeed = secret;
  while (finalSeed.length < 32) {
    finalSeed = finalSeed.repeat(2);
  }
  finalSeed = finalSeed.slice(0, 32);
  
  return new TextEncoder().encode(finalSeed);
}

/**
 * Ed25519 签名和验证类
 * 
 * 注意：由于 Web Crypto API 的限制，我们需要使用一些变通方法：
 * 1. Web Crypto API 不支持从种子生成 Ed25519 密钥对
 * 2. 我们需要手动实现 Ed25519 的密钥派生逻辑
 * 3. 使用 SHA-512 + Ed25519 curve 的标准流程
 * 
 * 但是，Cloudflare Workers 的 crypto.subtle 完全支持 Ed25519！
 * 我们可以直接使用 32 字节种子作为私钥。
 */
export class Ed25519 {
  private secret: string;
  private seedCache?: Uint8Array;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * 获取种子（缓存）
   */
  private getSeed(): Uint8Array {
    if (!this.seedCache) {
      this.seedCache = deriveSeed(this.secret);
    }
    return this.seedCache;
  }

  /**
   * 签名消息（用于 OpCode 13 回调验证）
   * 
   * @param message - 待签名的消息字符串
   * @returns 签名（hex 编码）
   */
  async sign(message: string): Promise<string> {
    try {
      const seed = this.getSeed();
      const messageBytes = new TextEncoder().encode(message);
      
      // 导入私钥（直接使用种子作为私钥）
      const privateKey = await crypto.subtle.importKey(
        'raw',
        seed,
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519',
        },
        false,
        ['sign']
      );
      
      // 签名
      const signatureBuffer = await crypto.subtle.sign(
        'Ed25519',
        privateKey,
        messageBytes
      );
      
      const signatureBytes = new Uint8Array(signatureBuffer);
      return bytesToHex(signatureBytes);
    } catch (error) {
      console.error('[Ed25519] Sign error:', error);
      throw error;
    }
  }

  /**
   * 验证签名（用于 OpCode 0 事件推送）
   * 
   * @param signature - 签名（hex 编码）
   * @param message - 原始消息字符串
   * @returns 签名是否有效
   */
  async verify(signature: string, message: string): Promise<boolean> {
    try {
      const seed = this.getSeed();
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = hexToBytes(signature);
      
      // Ed25519 签名应该是 64 字节
      if (signatureBytes.length !== 64) {
        console.error('[Ed25519] Invalid signature length:', signatureBytes.length, 'expected 64');
        return false;
      }
      
      // 导入私钥（种子）
      const privateKey = await crypto.subtle.importKey(
        'raw',
        seed,
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519',
        },
        true, // 需要可导出以获取公钥
        ['sign', 'verify']
      );
      
      // 导出公钥
      // 注意：Web Crypto API 不直接支持从私钥导出公钥
      // 我们需要使用一个技巧：先导出 JWK，然后重新导入为公钥
      const jwkRaw = await crypto.subtle.exportKey('jwk', privateKey);
      
      // 确保是 JsonWebKey 类型
      if (jwkRaw instanceof ArrayBuffer) {
        throw new Error('Unexpected ArrayBuffer from exportKey');
      }
      
      const jwk = jwkRaw as JsonWebKey;
      
      // 删除私钥部分，只保留公钥
      delete jwk.d;
      jwk.key_ops = ['verify'];
      
      const publicKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
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
        publicKey,
        signatureBytes,
        messageBytes
      );
      
      return isValid;
    } catch (error) {
      console.error('[Ed25519] Verify error:', error);
      return false;
    }
  }
}

/**
 * 验证 QQ Bot Webhook 签名（便捷函数）
 * 
 * @param body - 请求体（字符串）
 * @param timestamp - 时间戳（X-Signature-Timestamp header）
 * @param signature - 签名（X-Signature-Ed25519 header）
 * @param secret - App Secret
 * @returns 签名是否有效
 */
export async function verifyQQBotSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): Promise<boolean> {
  // QQ Bot 签名验证算法：timestamp + body
  const message = timestamp + body;
  const ed25519 = new Ed25519(secret);
  return ed25519.verify(signature, message);
}

/**
 * 签名 QQ Bot 回调验证（便捷函数，用于 OpCode 13）
 * 
 * @param eventTs - 事件时间戳
 * @param plainToken - 明文 token
 * @param secret - App Secret
 * @returns 签名（hex 编码）
 */
export async function signQQBotCallback(
  eventTs: string,
  plainToken: string,
  secret: string
): Promise<string> {
  // QQ Bot 回调验证算法：event_ts + plain_token
  const message = eventTs + plainToken;
  const ed25519 = new Ed25519(secret);
  return ed25519.sign(message);
}
