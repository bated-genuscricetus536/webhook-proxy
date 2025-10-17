import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { createHttpClient } from '../http.js';
import { ensureLoggedIn } from '../auth.js';

/**
 * Proxy 接口
 */
interface Proxy {
  id: string;
  name: string;
  platform: string;
  random_key: string;
  verify_signature: boolean;
  active: boolean;
  created_at: number;
  updated_at: number;
  last_event_at: number | null;
  event_count: number;
  access_token: string | null;
  webhook_secret: string | null;
  has_access_token: boolean;
  has_webhook_secret: boolean;
  secrets_hidden: boolean;
  webhook_url: string;
  websocket_url: string;
  sse_url: string;
}

/**
 * 列出所有 proxies
 */
export async function listProxies(): Promise<void> {
  await ensureLoggedIn();

  const spinner = ora('正在获取 proxies...').start();

  try {
    const client = createHttpClient();
    const response = await client.get<{ proxies: Proxy[] }>('/api/proxies');

    if (!response.success) {
      spinner.fail(chalk.red(`获取失败: ${response.error}`));
      process.exit(1);
    }

    spinner.stop();

    const proxies = response.data?.proxies || [];

    if (proxies.length === 0) {
      console.log(chalk.yellow('暂无 proxy'));
      return;
    }

    console.log(chalk.bold(`\n共 ${proxies.length} 个 proxy:\n`));

    proxies.forEach((proxy) => {
      console.log(chalk.bold.cyan(`[${proxy.id}] ${proxy.name}`));
      console.log(`  平台: ${proxy.platform}`);
      console.log(`  状态: ${proxy.active ? chalk.green('活跃') : chalk.gray('禁用')}`);
      console.log(`  事件数: ${proxy.event_count}`);
      console.log(`  最后事件: ${proxy.last_event_at ? new Date(proxy.last_event_at).toLocaleString() : '无'}`);
      console.log(`  Webhook URL: ${chalk.blue(proxy.webhook_url)}`);
      console.log(`  WebSocket URL: ${chalk.blue(proxy.websocket_url)}`);
      console.log(`  SSE URL: ${chalk.blue(proxy.sse_url)}`);
      if (proxy.access_token) {
        console.log(`  Access Token: ${proxy.access_token}`);
      }
      if (proxy.webhook_secret) {
        console.log(`  Webhook Secret: ${proxy.webhook_secret}`);
      }
      console.log('');
    });
  } catch (error: any) {
    spinner.fail(chalk.red(`获取失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 创建新的 proxy
 */
export async function createProxy(): Promise<void> {
  await ensureLoggedIn();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Proxy 名称:',
      validate: (input) => (input ? true : 'Proxy 名称不能为空'),
    },
    {
      type: 'list',
      name: 'platform',
      message: '选择平台:',
      choices: ['github', 'gitlab', 'qqbot', 'telegram', 'stripe', 'jenkins', 'jira', 'sentry', 'generic'],
    },
    {
      type: 'input',
      name: 'webhook_secret',
      message: 'Webhook Secret (可选):',
    },
    {
      type: 'input',
      name: 'platform_app_id',
      message: 'Platform App ID (可选，QQBot/Telegram 需要):',
    },
    {
      type: 'confirm',
      name: 'verify_signature',
      message: '是否验证签名?',
      default: true,
    },
  ]);

  const spinner = ora('正在创建 proxy...').start();

  try {
    const client = createHttpClient();
    const response = await client.post<{ proxy: Proxy }>('/api/proxies', {
      name: answers.name,
      platform: answers.platform,
      webhook_secret: answers.webhook_secret || undefined,
      platform_app_id: answers.platform_app_id || undefined,
      verify_signature: answers.verify_signature,
    });

    if (!response.success) {
      spinner.fail(chalk.red(`创建失败: ${response.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('✓ Proxy 创建成功'));

    const proxy = response.data?.proxy;
    if (proxy) {
      console.log(chalk.bold.cyan(`\n${proxy.name}`));
      console.log(`  ID: ${proxy.id}`);
      console.log(`  平台: ${proxy.platform}`);
      console.log(`  Webhook URL: ${chalk.blue(proxy.webhook_url)}`);
      console.log(`  WebSocket URL: ${chalk.blue(proxy.websocket_url)}`);
      console.log(`  SSE URL: ${chalk.blue(proxy.sse_url)}`);
      if (proxy.access_token) {
        console.log(`  Access Token: ${proxy.access_token}`);
      }
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`创建失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 更新 proxy
 */
export async function updateProxy(id: string): Promise<void> {
  await ensureLoggedIn();

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Proxy 名称 (留空跳过):',
    },
    {
      type: 'input',
      name: 'webhook_secret',
      message: 'Webhook Secret (留空跳过):',
    },
    {
      type: 'list',
      name: 'verify_signature',
      message: '是否验证签名 (留空跳过):',
      choices: ['true', 'false', '跳过'],
    },
    {
      type: 'list',
      name: 'active',
      message: '是否激活 (留空跳过):',
      choices: ['true', 'false', '跳过'],
    },
  ]);

  const updates: any = {};
  if (answers.name) updates.name = answers.name;
  if (answers.webhook_secret) updates.webhook_secret = answers.webhook_secret;
  if (answers.verify_signature !== '跳过') {
    updates.verify_signature = answers.verify_signature === 'true';
  }
  if (answers.active !== '跳过') {
    updates.active = answers.active === 'true';
  }

  if (Object.keys(updates).length === 0) {
    console.log(chalk.yellow('没有更新'));
    return;
  }

  const spinner = ora('正在更新 proxy...').start();

  try {
    const client = createHttpClient();
    const response = await client.put(`/api/proxies/${id}`, updates);

    if (!response.success) {
      spinner.fail(chalk.red(`更新失败: ${response.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('✓ Proxy 更新成功'));
  } catch (error: any) {
    spinner.fail(chalk.red(`更新失败: ${error.message}`));
    process.exit(1);
  }
}

/**
 * 删除 proxy
 */
export async function deleteProxy(id: string): Promise<void> {
  await ensureLoggedIn();

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `确定要删除 proxy ${id} 吗?`,
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.yellow('已取消'));
    return;
  }

  const spinner = ora('正在删除 proxy...').start();

  try {
    const client = createHttpClient();
    const response = await client.delete(`/api/proxies/${id}`);

    if (!response.success) {
      spinner.fail(chalk.red(`删除失败: ${response.error}`));
      process.exit(1);
    }

    spinner.succeed(chalk.green('✓ Proxy 删除成功'));
  } catch (error: any) {
    spinner.fail(chalk.red(`删除失败: ${error.message}`));
    process.exit(1);
  }
}

