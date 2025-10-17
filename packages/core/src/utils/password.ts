/**
 * 密码加密和验证工具
 * 使用 Web Crypto API（Cloudflare Workers 兼容）
 */

/**
 * 使用 PBKDF2 对密码进行哈希
 * @param password 明文密码
 * @returns 哈希后的密码（包含 salt）
 */
export async function hashPassword(password: string): Promise<string> {
  // 生成随机 salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // 将密码转换为 ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // 导入密码作为 CryptoKey
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // 使用 PBKDF2 派生密钥
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // 将 salt 和 hash 组合并转换为 base64
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt, 0);
  combined.set(hashArray, salt.length);
  
  // 转换为 base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hash 存储的哈希值
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // 解码 base64
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    
    // 提取 salt（前 16 字节）
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // 将密码转换为 ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // 导入密码作为 CryptoKey
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // 使用相同的 salt 派生密钥
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const hashArray = new Uint8Array(derivedBits);
    
    // 比较哈希值
    if (hashArray.length !== storedHash.length) {
      return false;
    }
    
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== storedHash[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * 验证密码强度
 * @param password 密码
 * @returns { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少 8 个字符');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

