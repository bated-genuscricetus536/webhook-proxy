# 客户端示例

本目录包含使用 Webhook Proxy 的客户端示例。

## 文件说明

- `client.html` - 浏览器客户端示例（WebSocket 和 SSE）
- `client.js` - Node.js 客户端示例
- `package.json` - Node.js 客户端依赖

## 使用方法

### 浏览器客户端

直接在浏览器中打开 `client.html`：

```bash
open client.html
```

或通过 HTTP 服务器访问：

```bash
# 使用 Python
python3 -m http.server 8080

# 使用 Node.js (需要安装 http-server)
npx http-server
```

然后访问 `http://localhost:8080/client.html`

### Node.js 客户端

1. 安装依赖：

```bash
cd examples
npm install
```

2. 运行 WebSocket 客户端：

```bash
npm run ws
```

3. 运行 SSE 客户端：

```bash
npm run sse
```

4. 自定义服务器地址：

```bash
SERVER_URL=http://your-server:3000 npm run ws
```

## 测试

确保 Webhook Proxy 服务器正在运行：

```bash
cd ..
npm run dev
```

然后在另一个终端运行客户端示例。

