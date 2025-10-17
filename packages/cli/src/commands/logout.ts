import chalk from 'chalk';
import { clearToken } from '../config.js';

/**
 * 登出命令
 */
export async function logout(): Promise<void> {
  try {
    clearToken();
    console.log(chalk.green('✓ 已登出'));
  } catch (error: any) {
    console.error(chalk.red('登出失败:', error.message));
    process.exit(1);
  }
}

