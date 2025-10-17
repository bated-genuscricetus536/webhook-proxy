/**
 * 性能监控工具
 */

export interface PerformanceMetrics {
  duration: number;
  platform: string;
  randomKey: string;
  status: 'success' | 'error';
  errorType?: string;
  timestamp: number;
}

export class PerformanceMonitor {
  private startTime: number;
  private platform: string;
  private randomKey: string;

  constructor(platform: string, randomKey: string) {
    this.startTime = Date.now();
    this.platform = platform;
    this.randomKey = randomKey;
  }

  /**
   * 完成监控，返回性能指标
   */
  end(status: 'success' | 'error', errorType?: string): PerformanceMetrics {
    const duration = Date.now() - this.startTime;
    
    const metrics: PerformanceMetrics = {
      duration,
      platform: this.platform,
      randomKey: this.randomKey,
      status,
      errorType,
      timestamp: Date.now(),
    };

    // 记录性能日志
    this.logMetrics(metrics);

    return metrics;
  }

  /**
   * 记录性能指标
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    const { duration, platform, status, errorType } = metrics;

    if (status === 'error') {
      console.error(
        `[Performance] ❌ ${platform} - ${duration}ms - Error: ${errorType}`
      );
    } else if (duration > 5000) {
      // 超过 5 秒警告
      console.warn(
        `[Performance] ⚠️  ${platform} - ${duration}ms - Slow response`
      );
    } else if (duration > 1000) {
      // 超过 1 秒提示
      console.info(
        `[Performance] ⏱️  ${platform} - ${duration}ms`
      );
    } else {
      // 正常
      console.log(
        `[Performance] ✅ ${platform} - ${duration}ms`
      );
    }
  }
}

/**
 * 错误分类
 */
export function classifyError(error: any): string {
  if (error instanceof TypeError) {
    return 'TypeError';
  } else if (error instanceof SyntaxError) {
    return 'SyntaxError';
  } else if (error instanceof Error) {
    if (error.message.includes('signature')) {
      return 'SignatureError';
    } else if (error.message.includes('timeout')) {
      return 'TimeoutError';
    } else if (error.message.includes('network')) {
      return 'NetworkError';
    }
    return 'Error';
  }
  return 'UnknownError';
}

/**
 * 重试机制配置
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100, // 100ms
  maxDelay: 5000, // 5s
  backoffMultiplier: 2,
};

/**
 * 带重试的异步操作
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  errorHandler?: (error: any, attempt: number) => boolean // 返回 true 继续重试，false 停止
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 如果有自定义错误处理器，判断是否继续重试
      if (errorHandler && !errorHandler(error, attempt)) {
        throw error;
      }

      // 最后一次尝试失败，直接抛出错误
      if (attempt === finalConfig.maxRetries) {
        console.error(`[Retry] Failed after ${attempt + 1} attempts:`, error);
        throw error;
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      );

      console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * 内存使用监控（仅用于调试）
 * 注意：Cloudflare Workers 不支持 process.memoryUsage
 */
export function logMemoryUsage(): void {
  // Cloudflare Workers 环境下不可用
  console.log('[Memory] Memory monitoring not available in Workers environment');
}

