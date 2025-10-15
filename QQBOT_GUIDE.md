# 🤖 QQ Bot Webhook 集成指南

本指南介绍如何将 QQ 官方机器人的 Webhook 事件转发到 WebSocket 或 SSE。

## 📋 前置要求

1. ✅ 已部署 Webhook Proxy 服务
2. ✅ 拥有 QQ 官方机器人账号
3. ✅ 获取机器人的 App ID 和公钥

## 🔑 获取 QQ Bot 凭据

### 1. 登录 QQ 开放平台

访问：https://q.qq.com/#/app/bot

### 2. 创建/选择机器人

- 进入机器人管理页面
- 记录 **App ID**（机器人 ID）

### 3. 获取公钥

- 在机器人设置中找到 **开发设置**
- 复制 **公钥**（Ed25519 公钥，hex 格式）
- 公钥格式：64 个十六进制字符（32 字节）
- 示例：`a1b2c3d4e5f6...`（完整 64 个字符）

**⚠️ 重要提示：**
- 公钥是 hex 编码的 Ed25519 公钥
- 长度必须是 64 个字符（0-9, a-f）
- 请完整复制，不要遗漏任何字符
- 不要泄露公钥给他人

## 🚀 快速开始

### 1. 创建 QQ Bot Proxy

访问 Dashboard，点击"创建新 Proxy"：

```json
{
  "name": "My QQ Bot",
  "platform": "qqbot",
  "platform_app_id": "your_app_id_here",
  "webhook_secret": "your_public_key_here",
  "verify_signature": true
}
```

**参数说明：**
- `name`: Proxy 名称（自定义）
- `platform`: 固定为 `qqbot`
- `platform_app_id`: QQ Bot 的 App ID
- `webhook_secret`: QQ Bot 的公钥（hex 格式）
- `verify_signature`: 是否验证签名（推荐启用）

### 2. 配置 QQ Bot Webhook

创建成功后，会得到：

```
Webhook URL: https://your-domain.com/qqbot/xxxxx
```

在 QQ 开放平台配置 Webhook：

1. 进入机器人管理页面
2. 找到 **事件订阅** → **Webhook 方式**
3. 填写回调地址：上面获取的 Webhook URL
4. 选择需要订阅的事件
5. 保存配置

QQ 开放平台会向你的回调地址发送验证请求（OpCode 13），Webhook Proxy 会自动响应。

### 3. 接收事件

#### WebSocket 方式

```javascript
const ws = new WebSocket('wss://your-domain.com/qqbot/xxxxx/ws?token=your_access_token');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('QQ Bot 事件:', data);
  
  // data 结构：
  // {
  //   id: '事件ID',
  //   platform: 'qqbot',
  //   type: '事件类型 (如 AT_MESSAGE_CREATE)',
  //   timestamp: 1234567890,
  //   headers: { ... },
  //   payload: { ... },  // 原始 QQ Bot 事件数据
  //   data: {
  //     opcode: 0,
  //     event_type: 'AT_MESSAGE_CREATE',
  //     sequence: 42,
  //     event_data: { ... }
  //   }
  // }
};

ws.onerror = (error) => {
  console.error('连接错误:', error);
};
```

#### SSE 方式

```javascript
const es = new EventSource('https://your-domain.com/qqbot/xxxxx/sse?token=your_access_token');

es.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('QQ Bot 事件:', data);
};

es.onerror = (error) => {
  console.error('连接错误:', error);
};
```

## 📡 QQ Bot 事件类型

Webhook Proxy 支持所有 QQ Bot 事件类型（OpCode 0 - Dispatch）：

### 公域事件
- `AT_MESSAGE_CREATE` - 用户 @ 机器人
- `PUBLIC_MESSAGE_DELETE` - 频道消息删除

### 私域事件（需要权限）
- `MESSAGE_CREATE` - 频道消息
- `MESSAGE_DELETE` - 消息删除
- `MESSAGE_REACTION_ADD` - 添加表情
- `MESSAGE_REACTION_REMOVE` - 移除表情

### 群聊和私聊事件
- `C2C_MESSAGE_CREATE` - 用户单聊消息
- `FRIEND_ADD` - 添加好友
- `FRIEND_DEL` - 删除好友
- `GROUP_AT_MESSAGE_CREATE` - 群聊 @ 机器人
- `GROUP_ADD_ROBOT` - 机器人被添加到群
- `GROUP_DEL_ROBOT` - 机器人被移出群

### 其他事件
- `GUILD_CREATE` / `GUILD_UPDATE` / `GUILD_DELETE` - 频道事件
- `CHANNEL_CREATE` / `CHANNEL_UPDATE` / `CHANNEL_DELETE` - 子频道事件
- `GUILD_MEMBER_ADD` / `GUILD_MEMBER_UPDATE` / `GUILD_MEMBER_REMOVE` - 成员事件
- `INTERACTION_CREATE` - 互动事件
- `AUDIO_START` / `AUDIO_FINISH` - 音频事件

完整事件列表请参考：https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html

## 🔒 签名验证

QQ Bot 使用 **Ed25519** 签名算法：

### 验证流程

1. QQ 开放平台发送请求时携带：
   - `X-Signature-Timestamp`: 时间戳
   - `X-Signature-Ed25519`: 签名（hex 编码）

2. Webhook Proxy 验证签名：
   ```
   message = timestamp + body
   verify(message, signature, publicKey)
   ```

3. 签名验证通过后，转发事件

### 回调地址验证

QQ 开放平台配置回调地址时会发送验证请求（OpCode 13）：

```json
{
  "op": 13,
  "d": {
    "plain_token": "需要计算签名的字符串",
    "event_ts": "时间戳"
  }
}
```

Webhook Proxy 会自动响应验证请求。

## 🔧 高级配置

### 禁用签名验证（不推荐）

如果在开发环境想禁用签名验证：

```json
{
  "name": "Test QQ Bot",
  "platform": "qqbot",
  "platform_app_id": "your_app_id",
  "webhook_secret": "",
  "verify_signature": false
}
```

⚠️ **警告**：生产环境请务必启用签名验证！

### 事件过滤

你可以在客户端根据 `data.event_type` 过滤需要的事件：

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // 只处理 @ 消息
  if (data.type === 'AT_MESSAGE_CREATE') {
    handleAtMessage(data.data.event_data);
  }
  
  // 只处理群聊消息
  if (data.type === 'GROUP_AT_MESSAGE_CREATE') {
    handleGroupMessage(data.data.event_data);
  }
};
```

## 🐛 故障排查

### 1. 回调地址验证失败

**可能原因：**
- 公钥配置错误
- 回调 URL 不可访问
- 端口不在允许列表（80、443、8080、8443）

**解决方法：**
- 检查公钥是否正确（hex 格式）
- 确保 Webhook URL 可以从公网访问
- 使用允许的端口

### 2. 收不到事件

**可能原因：**
- 未订阅对应事件类型
- 签名验证失败
- WebSocket/SSE 连接断开

**解决方法：**
- 在 QQ 开放平台检查事件订阅配置
- 检查日志确认签名验证状态
- 实现 WebSocket 重连机制

### 3. 签名验证失败

**可能原因：**
- 公钥错误
- 时间戳过期
- 请求体被修改

**解决方法：**
- 确认公钥格式正确（hex 编码）
- 检查服务器时间是否同步
- 使用 `wrangler tail` 查看详细日志

## 📚 相关资源

- [QQ 开放平台](https://q.qq.com/#/app/bot)
- [QQ Bot 开发文档](https://bot.q.qq.com/wiki/)
- [事件订阅说明](https://bot.q.qq.com/wiki/develop/api-v2/dev-prepare/interface-framework/event-emit.html)
- [Ed25519 签名算法](https://ed25519.cr.yp.to/)

## 💡 示例代码

完整示例代码请参考：

- Node.js: [examples/qqbot-websocket.js](examples/qqbot-websocket.js)
- Python: [examples/qqbot-sse.py](examples/qqbot-sse.py)
- Browser: [examples/qqbot-browser.html](examples/qqbot-browser.html)

---

**🎉 现在你可以实时接收 QQ Bot 事件了！**

有问题？提交 [Issue](https://github.com/lc-cn/webhook-proxy/issues)

