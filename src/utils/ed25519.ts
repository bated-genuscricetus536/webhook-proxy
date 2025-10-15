/**
 * Ed25519 签名验证工具
 * 用于 QQ Bot Webhook 签名验证
 * 
 * 参考：
 * - https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html#webhook%E6%96%B9%E5%BC%8F
 * - https://github.com/zhinjs/qq-official-bot
 * - @noble/curves/ed25519 (纯 JS 实现，Cloudflare Workers 兼容)
 * 
 * QQ Bot 签名机制：
 * 1. OpCode 13（回调验证）：签名 event_ts + plain_token 并返回
 * 2. OpCode 0（事件推送）：验证 QQ Bot 发来的签名（timestamp + body）
 * 3. 签名算法：Ed25519，使用 App Secret 派生密钥对
 * 
 * 密钥派生规则：
 * - 将 secret 重复填充到至少 32 字节
 * - 截取前 32 字节作为种子
 * - 使用种子通过 TweetNaCl 兼容的方式生成 Ed25519 密钥对
 */

// @ts-ignore - @noble/curves 可能没有类型定义
import { ed25519 } from '@noble/curves/ed25519';

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
 * 使用 @noble/curves/ed25519（TweetNaCl 兼容）
 */
export class Ed25519 {
  private secret: string;
  private seedCache?: Uint8Array;
  private privateKeyCache?: Uint8Array;
  private publicKeyCache?: Uint8Array;

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
   * 获取私钥（从种子派生，TweetNaCl 兼容）
   */
  private getPrivateKey(): Uint8Array {
    if (!this.privateKeyCache) {
      const seed = this.getSeed();
      // @noble/curves 的 ed25519.utils.getExtendedPublicKey 返回完整的私钥
      // 但我们需要使用种子直接作为私钥（TweetNaCl 方式）
      this.privateKeyCache = seed;
    }
    return this.privateKeyCache;
  }

  /**
   * 获取公钥（从私钥派生）
   */
  private getPublicKey(): Uint8Array {
    if (!this.publicKeyCache) {
      const privateKey = this.getPrivateKey();
      // 从私钥（种子）生成公钥
      const pubKey = ed25519.getPublicKey(privateKey);
      this.publicKeyCache = pubKey instanceof Uint8Array ? pubKey : new Uint8Array(pubKey);
    }
    return this.publicKeyCache;
  }

  /**
   * 签名消息（用于 OpCode 13 回调验证）
   * 
   * @param message - 待签名的消息字符串
   * @returns 签名（hex 编码）
   */
  async sign(message: string): Promise<string> {
    try {
      const privateKey = this.getPrivateKey();
      const messageBytes = new TextEncoder().encode(message);
      
      console.log('[Ed25519] Signing message...');
      console.log('[Ed25519]   Message:', message);
      console.log('[Ed25519]   Message bytes length:', messageBytes.length);
      console.log('[Ed25519]   Private key (seed) length:', privateKey.length);
      
      // 使用 @noble/curves 签名
      const signatureBytes = ed25519.sign(messageBytes, privateKey);
      
      console.log('[Ed25519]   Signature length:', signatureBytes.length);
      
      const signature = bytesToHex(signatureBytes);
      console.log('[Ed25519]   Signature:', signature.substring(0, 32) + '...');
      
      return signature;
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
      const publicKey = this.getPublicKey();
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = hexToBytes(signature);
      
      console.log('[Ed25519] Verifying signature...');
      console.log('[Ed25519]   Message length:', messageBytes.length);
      console.log('[Ed25519]   Signature length:', signatureBytes.length);
      console.log('[Ed25519]   Public key length:', publicKey.length);
      
      // Ed25519 签名应该是 64 字节
      if (signatureBytes.length !== 64) {
        console.error('[Ed25519] Invalid signature length:', signatureBytes.length, 'expected 64');
        return false;
      }
      
      // 使用 @noble/curves 验证签名
      const isValid = ed25519.verify(signatureBytes, messageBytes, publicKey);
      
      console.log('[Ed25519]   Verification result:', isValid);
      
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
  const ed25519Instance = new Ed25519(secret);
  return ed25519Instance.verify(signature, message);
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
  const ed25519Instance = new Ed25519(secret);
  return ed25519Instance.sign(message);
}
