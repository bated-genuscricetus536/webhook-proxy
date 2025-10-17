import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * CLI 配置接口
 */
export interface Config {
  apiUrl: string;
  token?: string;
}

/**
 * 配置文件路径
 */
const CONFIG_DIR = join(homedir(), '.webhook-proxy');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * 获取默认 API URL
 * 优先级：环境变量 API_URL > 默认值 http://localhost:8787
 */
function getDefaultApiUrl(): string {
  return process.env.API_URL || 'http://localhost:8787';
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Config = {
  apiUrl: getDefaultApiUrl(),
};

/**
 * 加载配置
 */
export function loadConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.error('Failed to load config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存配置
 */
export function saveConfig(config: Config): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

/**
 * 获取 token
 */
export function getToken(): string | undefined {
  const config = loadConfig();
  return config.token;
}

/**
 * 设置 token
 */
export function setToken(token: string): void {
  const config = loadConfig();
  config.token = token;
  saveConfig(config);
}

/**
 * 清除 token
 */
export function clearToken(): void {
  const config = loadConfig();
  delete config.token;
  saveConfig(config);
}

/**
 * 设置 API URL
 */
export function setApiUrl(url: string): void {
  const config = loadConfig();
  config.apiUrl = url;
  saveConfig(config);
}

/**
 * 获取 API URL
 */
export function getApiUrl(): string {
  const config = loadConfig();
  return config.apiUrl;
}

