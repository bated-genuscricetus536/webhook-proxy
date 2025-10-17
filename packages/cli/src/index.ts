#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { loginCommand } from './commands/login.js';
import { logout } from './commands/logout.js';
import { listProxies, createProxy, updateProxy, deleteProxy } from './commands/proxy.js';
import { showConfig, configApiUrl, interactiveConfig } from './commands/config.js';

const program = new Command();

program
  .name('webhook-proxy')
  .description('Webhook Proxy CLI - 管理 webhook proxy 的命令行工具')
  .version('1.0.0');

// 登录命令
program
  .command('login')
  .description('登录到 Webhook Proxy (支持 GitHub, GitLab, 密码, Passkey)')
  .action(async () => {
    await loginCommand();
  });

// 登出命令
program
  .command('logout')
  .description('登出当前账户')
  .action(async () => {
    await logout();
  });

// Proxy 管理命令
const proxyCommand = program.command('proxy').description('管理 webhook proxies');

proxyCommand
  .command('list')
  .alias('ls')
  .description('列出所有 proxies')
  .action(async () => {
    await listProxies();
  });

proxyCommand
  .command('create')
  .alias('add')
  .description('创建新的 proxy')
  .action(async () => {
    await createProxy();
  });

proxyCommand
  .command('update <id>')
  .description('更新 proxy')
  .action(async (id: string) => {
    await updateProxy(id);
  });

proxyCommand
  .command('delete <id>')
  .alias('rm')
  .description('删除 proxy')
  .action(async (id: string) => {
    await deleteProxy(id);
  });

// 配置命令
const configCommand = program.command('config').description('管理 CLI 配置');

configCommand
  .command('show')
  .description('显示当前配置')
  .action(async () => {
    await showConfig();
  });

configCommand
  .command('set-api <url>')
  .description('设置 API URL')
  .action(async (url: string) => {
    const { setApiUrl } = await import('./config.js');
    setApiUrl(url);
    console.log(chalk.green('✓ API URL 已更新'));
  });


configCommand
  .command('interactive')
  .alias('i')
  .description('交互式配置')
  .action(async () => {
    await interactiveConfig();
  });

// 快捷命令：直接列出 proxies
program
  .command('list')
  .alias('ls')
  .description('列出所有 proxies (快捷命令)')
  .action(async () => {
    await listProxies();
  });

// 错误处理
program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
});

// 解析命令
program.parse(process.argv);

// 如果没有参数，显示帮助
if (process.argv.length === 2) {
  program.help();
}

