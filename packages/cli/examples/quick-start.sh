#!/bin/bash
# Webhook Proxy CLI 快速开始脚本

set -e

echo "🚀 Webhook Proxy CLI 快速开始"
echo "================================"
echo ""

# 检查 Node.js 版本
echo "检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 需要 Node.js >= 18.0.0，当前版本: $(node -v)"
  exit 1
fi
echo "✓ Node.js 版本: $(node -v)"
echo ""

# 询问 API 地址
echo "请输入 API 地址 (默认: http://localhost:8787):"
read -r API_URL
API_URL=${API_URL:-http://localhost:8787}

# 配置 API 地址
echo ""
echo "配置 API 地址..."
webhook-proxy config set-api "$API_URL"
echo ""

# 显示配置
echo "当前配置:"
webhook-proxy config show
echo ""

# 询问是否立即登录
echo "是否立即登录? (y/n, 默认: y)"
read -r LOGIN
LOGIN=${LOGIN:-y}

if [ "$LOGIN" = "y" ] || [ "$LOGIN" = "Y" ]; then
  echo ""
  echo "开始登录..."
  webhook-proxy login
  echo ""
  echo "✓ 登录成功！"
fi

echo ""
echo "================================"
echo "🎉 配置完成！"
echo ""
echo "可用命令："
echo "  webhook-proxy list          - 列出所有 proxies"
echo "  webhook-proxy proxy create  - 创建新的 proxy"
echo "  webhook-proxy --help        - 查看所有命令"
echo ""
echo "更多信息请参考: https://github.com/lc-cn/webhook-proxy/tree/master/cli"
echo "================================"

