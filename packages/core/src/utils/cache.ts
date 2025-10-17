/**
 * 简单的内存缓存
 * 用于缓存常用的 Proxy 配置，减少数据库查询
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;

  constructor(ttl: number = 60000) { // 默认 60 秒
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.ttl);
    
    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * 删除缓存值
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 带自动加载的缓存
 */
export async function cachedGet<T>(
  cache: SimpleCache<T>,
  key: string,
  loader: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // 先尝试从缓存获取
  const cached = cache.get(key);
  
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，加载数据
  const value = await loader();
  
  // 存入缓存
  cache.set(key, value, ttl);
  
  return value;
}

