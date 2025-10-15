#!/bin/bash

# Webhook Proxy 本地测试脚本
# 用法: ./test-webhook.sh [random-key]

set -e

BASE_URL="${BASE_URL:-http://localhost:8787}"
RANDOM_KEY="${1:-}"

echo "🧪 Webhook Proxy 测试脚本"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 健康检查
echo "1️⃣  测试健康检查..."
if curl -s -f $BASE_URL/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 健康检查通过"
    curl -s $BASE_URL/health | jq .
else
    echo -e "${RED}✗${NC} 健康检查失败"
    exit 1
fi

echo ""

# 2. 创建或使用 Proxy
if [ -z "$RANDOM_KEY" ]; then
    echo "2️⃣  创建新 Proxy..."
    
    RESPONSE=$(curl -s -X POST $BASE_URL/api/proxies \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Proxy",
        "platform": "github",
        "verify_signature": false
      }')
    
    if echo $RESPONSE | jq -e '.proxy' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Proxy 创建成功"
        echo $RESPONSE | jq .
        RANDOM_KEY=$(echo $RESPONSE | jq -r '.proxy.random_key')
        echo ""
        echo -e "${YELLOW}Random Key: $RANDOM_KEY${NC}"
    else
        echo -e "${RED}✗${NC} Proxy 创建失败"
        echo $RESPONSE | jq .
        exit 1
    fi
else
    echo -e "${YELLOW}2️⃣  使用已存在的 Random Key: $RANDOM_KEY${NC}"
fi

echo ""

# 3. 列出所有 Proxies
echo "3️⃣  列出所有 Proxies..."
PROXIES=$(curl -s $BASE_URL/api/proxies)
if echo $PROXIES | jq -e '.proxies' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 获取 Proxies 列表成功"
    echo $PROXIES | jq '.proxies | length' | xargs echo "总共有" | xargs echo -n
    echo " 个 Proxy"
else
    echo -e "${RED}✗${NC} 获取 Proxies 列表失败"
fi

echo ""

# 4. 发送测试 Webhook (GitHub Push Event)
echo "4️⃣  发送测试 GitHub Push Webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST $BASE_URL/github/$RANDOM_KEY \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-delivery-$(date +%s)" \
  -d '{
    "ref": "refs/heads/main",
    "before": "0000000000000000000000000000000000000000",
    "after": "1111111111111111111111111111111111111111",
    "repository": {
      "id": 123456789,
      "name": "test-repo",
      "full_name": "testuser/test-repo",
      "html_url": "https://github.com/testuser/test-repo"
    },
    "pusher": {
      "name": "testuser",
      "email": "test@example.com"
    },
    "sender": {
      "id": 1,
      "login": "testuser",
      "type": "User"
    },
    "commits": [
      {
        "id": "1111111111111111111111111111111111111111",
        "message": "Test commit",
        "timestamp": "2024-01-01T00:00:00Z",
        "author": {
          "name": "Test User",
          "email": "test@example.com"
        }
      }
    ]
  }')

if echo $WEBHOOK_RESPONSE | jq -e '.status' > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Webhook 发送成功"
    echo $WEBHOOK_RESPONSE | jq .
else
    echo -e "${RED}✗${NC} Webhook 发送失败"
    echo $WEBHOOK_RESPONSE
fi

echo ""

# 5. 连接信息
echo "================================"
echo -e "${GREEN}✅ 测试完成！${NC}"
echo ""
echo "📝 连接信息："
echo "   Webhook URL: $BASE_URL/github/$RANDOM_KEY"
echo "   WebSocket URL: ws://localhost:8787/github/$RANDOM_KEY/ws"
echo "   SSE URL: $BASE_URL/github/$RANDOM_KEY/sse"
echo ""
echo "💡 提示："
echo "   - 在浏览器中打开 examples/client.html 测试 WebSocket/SSE"
echo "   - 使用 'npm run ws' 或 'npm run sse' 测试 Node.js 客户端"
echo "   - 重新运行测试: ./test-webhook.sh $RANDOM_KEY"

