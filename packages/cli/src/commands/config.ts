import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, saveConfig, setApiUrl } from '../config.js';

/**
 * 显示配置
 */
export async function showConfig(): Promise<void> {
  const config = loadConfig();

  console.log(chalk.bold('\n当前配置:\n'));
  console.log(`  API URL: ${chalk.cyan(config.apiUrl)}`);
  console.log(`  已登录: ${config.token ? chalk.green('是') : chalk.red('否')}`);
  console.log('');
}

/**
 * 配置 API URL
 */
export async function configApiUrl(): Promise<void> {
  const config = loadConfig();

  const { apiUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiUrl',
      message: 'API URL:',
      default: config.apiUrl,
      validate: (input) => (input ? true : 'API URL 不能为空'),
    },
  ]);

  setApiUrl(apiUrl);
  console.log(chalk.green('✓ API URL 已更新'));
}

/**
 * 交互式配置
 */
export async function interactiveConfig(): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择配置项:',
      choices: ['查看配置', '设置 API URL', '退出'],
    },
  ]);

  switch (action) {
    case '查看配置':
      await showConfig();
      break;
    case '设置 API URL':
      await configApiUrl();
      break;
    case '退出':
      return;
  }
}

