import express from 'express';
import open from 'open';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { setToken, loadConfig, getApiUrl } from './config.js';
import { createHttpClient } from './http.js';

/**
 * 用户信息接口
 */
interface UserInfo {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  created_at: number;
}

/**
 * /api/me 响应接口
 */
interface MeResponse {
  user: UserInfo;
}

/**
 * 密码登录响应接口
 */
interface PasswordLoginResponse {
  status: string;
  session_token: string;
  user: UserInfo;
}

/**
 * 启动本地服务器等待 OAuth 回调
 */
function startCallbackServer(port: number = 3456): Promise<string> {
  return new Promise((resolve, reject) => {
    const app = express();
    let server: any;

    // 超时控制
    const timeout = setTimeout(() => {
      if (server) {
        server.close();
      }
      reject(new Error('OAuth timeout'));
    }, 300000); // 5分钟超时

    app.get('/callback', (req, res) => {
      const { token, error } = req.query;

      if (error) {
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">认证失败</h1>
              <p>${error}</p>
              <p>您可以关闭此窗口</p>
            </body>
          </html>
        `);
        clearTimeout(timeout);
        server.close();
        reject(new Error(error as string));
        return;
      }

      if (token) {
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #4caf50;">✓ 认证成功！</h1>
              <p>您已成功登录，可以关闭此窗口</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
        clearTimeout(timeout);
        server.close();
        resolve(token as string);
      } else {
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #d32f2f;">认证失败</h1>
              <p>未收到有效的 token</p>
              <p>您可以关闭此窗口</p>
            </body>
          </html>
        `);
        clearTimeout(timeout);
        server.close();
        reject(new Error('No token received'));
      }
    });

    server = app.listen(port, () => {
      console.log(chalk.gray(`等待 OAuth 回调... (http://localhost:${port}/callback)`));
    });

    server.on('error', (err: any) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

/**
 * OAuth 登录（GitHub 或 GitLab）
 */
async function loginViaOAuth(provider: 'github' | 'gitlab'): Promise<void> {
  const spinner = ora('正在启动登录...').start();

  try {
    const apiUrl = getApiUrl();
    
    // 启动本地回调服务器
    const callbackPort = 3456;
    const callbackPromise = startCallbackServer(callbackPort);

    // 使用后端的 OAuth 端点，但在查询参数中传递 CLI 回调地址
    const authUrl = `${apiUrl}/auth/${provider}?cli_redirect=http://localhost:${callbackPort}/callback`;

    spinner.text = '正在打开浏览器...';
    
    // 打开浏览器
    await open(authUrl);

    spinner.text = '等待授权...';

    // 等待回调
    const token = await callbackPromise;

    // 保存 token
    setToken(token);

    spinner.text = '验证登录...';

    // 验证 token 是否有效
    const client = createHttpClient();
    client.setToken(token);
    const response = await client.get<MeResponse>('/api/me');

    if (!response.success) {
      throw new Error('Token 验证失败');
    }

    const user = response.data?.user;
    const providerName = provider === 'github' ? 'GitHub' : 'GitLab';
    spinner.succeed(chalk.green(`✓ ${providerName} 登录成功！欢迎 ${user?.username || '用户'}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`登录失败: ${error.message}`));
    throw error;
  }
}

/**
 * 密码登录
 */
async function loginWithPassword(): Promise<void> {
  console.log(chalk.cyan('\n=== 账号密码登录 ===\n'));

  const { username, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: '用户名或邮箱:',
      validate: (input) => (input ? true : '用户名或邮箱不能为空'),
    },
    {
      type: 'password',
      name: 'password',
      message: '密码:',
      mask: '*',
      validate: (input) => (input ? true : '密码不能为空'),
    },
  ]);

  const spinner = ora('正在登录...').start();

  try {
    const client = createHttpClient();
    const apiUrl = getApiUrl();
    
    // 调用后端密码登录 API
    const response = await client.post<PasswordLoginResponse>('/account/login', {
      username,
      password,
    });

    if (!response.success) {
      throw new Error(response.error || '登录失败');
    }

    const sessionToken = response.data?.session_token;
    if (!sessionToken) {
      throw new Error('未收到 session token');
    }

    // 保存 token
    setToken(sessionToken);

    const user = response.data?.user;
    spinner.succeed(chalk.green(`✓ 登录成功！欢迎 ${user?.username || '用户'}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`登录失败: ${error.message}`));
    throw error;
  }
}

/**
 * Passkey 登录（通过浏览器）
 */
async function loginWithPasskey(): Promise<void> {
  const spinner = ora('正在启动 Passkey 登录...').start();

  try {
    const apiUrl = getApiUrl();
    
    // 启动本地回调服务器
    const callbackPort = 3456;
    const callbackPromise = startCallbackServer(callbackPort);

    // 打开浏览器到 Dashboard 的 Passkey 登录页面
    // 需要传递 CLI 回调参数
    const loginUrl = `${apiUrl}/dashboard?passkey_login=true&cli_redirect=http://localhost:${callbackPort}/callback`;

    spinner.text = '正在打开浏览器...';
    
    // 打开浏览器
    await open(loginUrl);

    spinner.text = '等待 Passkey 认证...';

    // 等待回调
    const token = await callbackPromise;

    // 保存 token
    setToken(token);

    spinner.text = '验证登录...';

    // 验证 token 是否有效
    const client = createHttpClient();
    client.setToken(token);
    const response = await client.get<MeResponse>('/api/me');

    if (!response.success) {
      throw new Error('Token 验证失败');
    }

    const user = response.data?.user;
    spinner.succeed(chalk.green(`✓ Passkey 登录成功！欢迎 ${user?.username || '用户'}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`Passkey 登录失败: ${error.message}`));
    console.log(chalk.yellow('\n提示: Passkey 登录需要浏览器支持，请确保您已在 Dashboard 中注册过 Passkey'));
    throw error;
  }
}

/**
 * 手动输入 Token
 */
async function loginWithToken(): Promise<void> {
  console.log(chalk.cyan('\n=== 手动输入 Token ===\n'));
  console.log(chalk.gray('步骤：'));
  console.log(chalk.gray('1. 在浏览器中访问 API 网站'));
  console.log(chalk.gray('2. 登录您的账户'));
  console.log(chalk.gray('3. 打开浏览器开发者工具 (F12)'));
  console.log(chalk.gray('4. 在 Application > Cookies 中找到 "session" cookie'));
  console.log(chalk.gray('5. 复制 session cookie 的值\n'));

  const apiUrl = getApiUrl();
  console.log(chalk.yellow(`API 地址: ${apiUrl}\n`));

  const { shouldOpen } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldOpen',
      message: '是否打开浏览器?',
      default: true,
    },
  ]);

  if (shouldOpen) {
    await open(apiUrl);
  }

  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: '请输入 session token:',
      validate: (input) => (input ? true : 'Token 不能为空'),
    },
  ]);

  const spinner = ora('验证 token...').start();

  try {
    // 验证 token
    const client = createHttpClient();
    client.setToken(token);
    const response = await client.get<MeResponse>('/api/me');

    if (!response.success) {
      spinner.fail(chalk.red('Token 验证失败'));
      throw new Error('Invalid token');
    }

    // 保存 token
    setToken(token);

    const user = response.data?.user;
    spinner.succeed(chalk.green(`✓ 登录成功！欢迎 ${user?.username || '用户'}`));
  } catch (error: any) {
    spinner.fail(chalk.red(`登录失败: ${error.message}`));
    throw error;
  }
}

/**
 * 主登录函数（显示登录方式选择）
 */
export async function login(): Promise<void> {
  // 检查是否已登录
  const config = loadConfig();
  if (config.token) {
    const { continueLogin } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueLogin',
        message: '您已登录，是否重新登录?',
        default: false,
      },
    ]);
    if (!continueLogin) {
      console.log(chalk.yellow('已取消登录'));
      return;
    }
  }

  // 显示登录方式选择
  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: '选择登录方式:',
      choices: [
        { name: '🔐 GitHub OAuth（推荐）', value: 'github' },
        { name: '🦊 GitLab OAuth', value: 'gitlab' },
        { name: '👤 用户名/邮箱 + 密码', value: 'password' },
        { name: '🔑 Passkey / 指纹 / Face ID', value: 'passkey' },
        { name: '📋 手动输入 Token', value: 'token' },
      ],
    },
  ]);

  try {
    switch (method) {
      case 'github':
        await loginViaOAuth('github');
        break;
      case 'gitlab':
        await loginViaOAuth('gitlab');
        break;
      case 'password':
        await loginWithPassword();
        break;
      case 'passkey':
        await loginWithPasskey();
        break;
      case 'token':
        await loginWithToken();
        break;
      default:
        throw new Error('未知的登录方式');
    }
  } catch (error: any) {
    // 如果登录失败，询问是否尝试其他方式
    if (method !== 'token') {
      const { retry } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'retry',
          message: '登录失败，是否尝试其他登录方式?',
          default: true,
        },
      ]);
      if (retry) {
        await login();
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * GitHub OAuth 登录（向后兼容）
 */
export async function loginWithGitHub(): Promise<void> {
  await loginViaOAuth('github');
}

/**
 * 通用登录函数（检查缓存或执行登录）
 */
export async function ensureLoggedIn(): Promise<void> {
  const config = loadConfig();

  if (!config.token) {
    console.log(chalk.yellow('未登录，正在启动登录流程...'));
    await login();
  }
}
