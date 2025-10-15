# 贡献指南

感谢您对 Webhook Proxy 的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告问题

如果您发现了 bug 或有功能建议，请：

1. 检查是否已有相关 issue
2. 如果没有，创建新的 issue 并提供详细信息：
   - Bug：复现步骤、预期行为、实际行为、环境信息
   - 功能：详细描述、使用场景、可能的实现方案

### 提交代码

1. **Fork 仓库**

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **编写代码**
   - 遵循项目的代码风格
   - 添加必要的注释
   - 确保类型安全（TypeScript）
   - 注意 Cloudflare Workers 的限制和最佳实践

4. **测试**
   ```bash
   npm run type-check
   npm run dev  # 本地测试
   ```

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

   提交信息格式：
   - `feat:` 新功能
   - `fix:` 修复
   - `docs:` 文档
   - `style:` 格式化
   - `refactor:` 重构
   - `test:` 测试
   - `chore:` 构建/工具

6. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 开发新适配器

创建新平台适配器的步骤：

### 1. 创建适配器类

在 `src/adapters/` 目录下创建新文件，例如 `bitbucket-cf.ts`：

```typescript
import { CloudflareWebhookAdapter } from './base-cf.js';
import { WebhookEventData, AdapterConfig } from '../types/index.js';

export class BitbucketAdapter extends CloudflareWebhookAdapter {
  constructor(config: Partial<AdapterConfig> = {}) {
    super({
      platform: 'bitbucket',
      verifySignature: true,
      ...config
    });
  }

  async verifySignature(request: Request, body: any): Promise<boolean> {
    // 实现 Bitbucket 的签名验证
    if (!this.config.verifySignature || !this.config.secret) {
      return true;
    }
    
    const signature = request.headers.get('x-hub-signature');
    // ... 验证逻辑
    
    return true;
  }

  parse(request: Request, body: any): WebhookEventData | null {
    const eventType = request.headers.get('x-event-key');
    
    if (!eventType) {
      return null;
    }
    
    return {
      id: this.generateEventId(),
      platform: this.config.platform,
      type: eventType,
      timestamp: Date.now(),
      headers: this.extractHeaders(request),
      payload: body,
      data: {
        // 标准化数据
      }
    };
  }
}
```

### 2. 导出适配器

在 `src/adapters/index-cf.ts` 中添加导出：

```typescript
export { BitbucketAdapter } from './bitbucket-cf.js';
```

### 3. 更新主入口

在 `src/index.ts` 中添加路由处理逻辑，支持新平台。

### 4. 更新数据库 Schema

如果需要新的字段，创建新的迁移文件：

```sql
-- migrations/0002_add_bitbucket_support.sql
ALTER TABLE proxies ADD COLUMN bitbucket_specific_field TEXT;
```

### 5. 添加文档

更新 README.md，添加新平台的使用说明。

### 6. 测试

手动测试新适配器的各种事件类型。

## Cloudflare Workers 开发注意事项

### 1. 环境限制

- 不支持 Node.js 内置模块
- CPU 时间限制（免费套餐 10ms，付费 50ms）
- 内存限制（128MB）
- 不支持文件系统操作

### 2. Durable Objects

- 用于管理持久 WebSocket 连接
- 每个 Proxy 对应一个 DO 实例
- 注意状态管理和并发控制

### 3. D1 数据库

- SQLite 兼容
- 使用预编译语句
- 注意查询性能

### 4. KV 存储

- 用于 Session 管理
- 最终一致性
- 适合读多写少的场景

### 5. 异步操作

- 所有 I/O 操作都是异步的
- 使用 `ctx.waitUntil()` 处理后台任务
- 避免阻塞主线程

## 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESM 规范
- 添加 JSDoc 注释
- 使用有意义的变量名
- 保持函数简洁

## 项目结构

```
src/
├── adapters/          # 平台适配器
│   ├── base-cf.ts     # 基类（所有适配器继承）
│   ├── github-cf.ts
│   ├── gitlab-cf.ts
│   └── index-cf.ts
├── api/               # API 处理器
│   ├── auth.ts        # OAuth 认证
│   └── proxies.ts     # Proxy 管理
├── auth/              # 认证系统
│   └── oauth.ts
├── db/                # 数据库操作
│   ├── users.ts
│   └── proxies.ts
├── durable-objects/   # Durable Objects
│   └── webhook-connection.ts
├── types/             # 类型定义
│   ├── env.ts
│   ├── models.ts
│   └── index.ts
└── index.ts           # 主入口文件
```

## 常见问题

### Q: 如何调试？

使用 `wrangler dev` 启动本地开发服务器：

```bash
npm run dev
```

日志会输出到控制台。

### Q: 如何验证签名？

每个平台的签名验证方式不同：
- GitHub: HMAC-SHA256
- GitLab: Token 比对

使用 Web Crypto API：

```typescript
const key = await crypto.subtle.importKey(
  'raw',
  encoder.encode(secret),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);

const signature = await crypto.subtle.sign(
  'HMAC',
  key,
  encoder.encode(data)
);
```

### Q: 如何标准化事件数据？

在 `parse` 方法中提取通用字段：
- 仓库/项目信息
- 用户信息
- 事件特定数据

尽量保持数据结构一致，方便客户端处理。

### Q: 如何测试 OAuth？

1. 在 GitHub/GitLab 创建测试应用
2. 配置回调 URL 为本地地址（使用 ngrok 或 cloudflared tunnel）
3. 测试完整的登录流程

### Q: 如何测试 Durable Objects？

本地开发时，Wrangler 会模拟 Durable Objects 环境。使用 `wrangler dev` 即可测试。

### Q: 如何添加新的数据库字段？

1. 创建新的迁移文件 `migrations/000X_description.sql`
2. 运行迁移：
   ```bash
   npm run db:migrate:local  # 本地
   npm run db:migrate        # 生产
   ```

### Q: 如何处理错误？

- 使用 try-catch 捕获异常
- 返回适当的 HTTP 状态码
- 记录详细的错误日志
- 不要泄露敏感信息

## 测试

### 手动测试

1. 启动本地开发服务器
2. 使用 curl 或 Postman 测试 API
3. 使用浏览器测试 OAuth 流程
4. 使用 WebSocket/SSE 客户端测试实时连接

### 测试 Webhook

使用 webhook.site 或类似工具测试 webhook 接收。

## 部署

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm run deploy
```

### 环境配置

在 `wrangler.toml` 中配置不同环境：

```toml
[env.development]
name = "webhook-proxy-dev"

[env.production]
name = "webhook-proxy"
```

部署到特定环境：

```bash
wrangler deploy --env production
```

## 性能优化

1. **减少数据库查询**
   - 使用适当的索引
   - 批量操作
   - 缓存频繁访问的数据

2. **优化 Durable Objects**
   - 避免频繁的状态读写
   - 使用批量操作
   - 合理设置清理策略

3. **减少外部请求**
   - 缓存 OAuth 用户信息
   - 使用 CDN

## 获取帮助

- 查看现有的 issue 和 PR
- 阅读 Cloudflare Workers 文档
- 阅读源代码和注释
- 创建 issue 寻求帮助

## 行为准则

- 尊重他人
- 保持专业
- 提供建设性反馈
- 欢迎新贡献者

再次感谢您的贡献！🎉
