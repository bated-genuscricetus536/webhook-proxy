import { login } from '../auth.js';

/**
 * 登录命令
 */
export async function loginCommand(): Promise<void> {
  try {
    await login();
  } catch (error: any) {
    console.error('登录失败:', error.message);
    process.exit(1);
  }
}
