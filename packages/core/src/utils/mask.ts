/**
 * 掩码工具函数
 */

/**
 * 对字符串进行掩码处理
 * 显示前4个和后4个字符，中间用星号替代
 */
export function maskSecret(secret: string | null): string | null {
  if (!secret) return null;
  
  const length = secret.length;
  if (length <= 8) {
    // 太短的字符串，全部掩码
    return '*'.repeat(length);
  }
  
  // 显示前4个和后4个字符
  const start = secret.substring(0, 4);
  const end = secret.substring(length - 4);
  const middle = '*'.repeat(Math.min(length - 8, 20)); // 中间最多显示20个星号
  
  return `${start}${middle}${end}`;
}

