# CLI Secret 处理说明

## 问题背景

在 Web Dashboard 中，当用户启用 MFA 或 Passkey 后，API 会返回掩码版本的敏感信息（如 `access_token` 和 `webhook_secret`），以提高安全性。

但是，在 CLI 中，用户需要完整的 token 和 secret 来配置 webhook 和 WebSocket 连接。因此，CLI 需要特殊处理。

## 解决方案

### 1. CLI 请求标识

CLI 在所有 HTTP 请求中添加一个特殊的请求头：

```typescript
headers: {
  'X-Client-Type': 'cli'
}
```

### 2. API 识别和处理

API 在返回 proxy 数据时，会检查这个请求头：

```typescript
// 检查是否是 CLI 请求
const isCliRequest = c.req.header('X-Client-Type') === 'cli';

// CLI 请求时不掩码，Web 请求时如果启用了 MFA/Passkey 则掩码
const requireAuth = !isCliRequest && user && (user.mfa_enabled || user.passkey_enabled);
```

### 3. 行为对比

| 场景 | Web Dashboard | CLI |
|------|---------------|-----|
| **未启用 MFA/Passkey** | 返回完整 secrets | 返回完整 secrets |
| **启用 MFA/Passkey** | 返回掩码 secrets (`****abcd`) | 返回完整 secrets |

## 实现细节

### CLI 修改

**文件**: `packages/cli/src/http.ts`

```typescript
private async request<T>(
  method: string,
  path: string,
  body?: any
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Type': 'cli', // 标识这是 CLI 请求
  };
  // ...
}
```

### API 修改

**文件**: `packages/core/src/routes/api.ts`

#### GET /api/proxies

```typescript
// 检查是否是 CLI 请求
const isCliRequest = c.req.header('X-Client-Type') === 'cli';

// CLI 请求时不掩码
const requireAuth = !isCliRequest && user && (user.mfa_enabled || user.passkey_enabled);
```

#### POST /api/proxies

同样的逻辑应用于创建 proxy 的响应。

## 安全考虑

### 为什么这样做是安全的？

1. **认证要求不变**：CLI 仍然需要有效的 session token 才能访问 API
2. **用户控制**：只有通过 OAuth 登录的用户才能使用 CLI
3. **本地存储**：CLI 的 token 存储在用户本地的 `~/.webhook-proxy/config.json` 中
4. **传输安全**：所有 API 请求都通过 HTTPS 进行

### 潜在风险和缓解

| 风险 | 缓解措施 |
|------|---------|
| CLI token 泄露 | 使用文件系统权限保护配置文件 |
| 中间人攻击 | 强制使用 HTTPS |
| 未授权访问 | 需要有效的 session token |

## 用户体验

### CLI 用户

```bash
# 登录
webhook-proxy login

# 列出 proxies（即使启用了 MFA，也能看到完整的 token）
webhook-proxy list

# 输出示例
共 2 个 proxy:

[123] My GitHub Webhook
  平台: github
  状态: 活跃
  Access Token: whp_1234567890abcdef  # 完整 token
  Webhook Secret: secret123           # 完整 secret
  Webhook URL: https://api.example.com/github/random123
```

### Web Dashboard 用户

当启用 MFA/Passkey 后：

```json
{
  "access_token": "****cdef",  // 掩码版本
  "webhook_secret": "****t123", // 掩码版本
  "secrets_hidden": true
}
```

## 测试

### 测试场景

1. **未启用 MFA/Passkey**
   - CLI: ✅ 返回完整 secrets
   - Web: ✅ 返回完整 secrets

2. **启用 MFA/Passkey**
   - CLI: ✅ 返回完整 secrets（通过 `X-Client-Type: cli` 头）
   - Web: ✅ 返回掩码 secrets

### 测试命令

```bash
# 启动开发服务器
pnpm dev

# 在另一个终端测试 CLI
cd packages/cli
pnpm build
pnpm link --global
webhook-proxy login
webhook-proxy list  # 应该显示完整的 token 和 secret
```

## 未来改进

可能的改进方向：

1. **临时 Token**: 为 CLI 生成短期有效的临时 token
2. **审计日志**: 记录 CLI 访问敏感信息的日志
3. **权限细分**: 允许用户为 CLI 和 Web 设置不同的权限级别
4. **CLI 特定 Token**: 为 CLI 生成专用的 API token，与 Web session 分离

## 相关文件

- `packages/cli/src/http.ts` - CLI HTTP 客户端
- `packages/core/src/routes/api.ts` - API 路由（GET/POST /api/proxies）
- `packages/core/src/utils/mask.ts` - Secret 掩码工具

## 变更历史

- **2025-10-17**: 初始实现，添加 `X-Client-Type: cli` 头支持

