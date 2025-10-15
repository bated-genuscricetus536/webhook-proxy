/**
 * Node.js 客户端示例
 * 演示如何使用 WebSocket 或 SSE 接收 webhook 事件
 */

import WebSocket from 'ws';
import EventSource from 'eventsource';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

/**
 * WebSocket 客户端示例
 */
function websocketClient() {
  console.log('=== WebSocket 客户端 ===');
  const ws = new WebSocket(`${SERVER_URL.replace('http', 'ws')}/ws`);

  ws.on('open', () => {
    console.log('✅ WebSocket 已连接');
  });

  ws.on('message', (data) => {
    const event = JSON.parse(data.toString());
    
    if (event.type === 'connected') {
      console.log('📡', event.message);
      return;
    }

    console.log('\n🎯 收到事件:');
    console.log('  平台:', event.platform);
    console.log('  类型:', event.type);
    console.log('  时间:', new Date(event.timestamp).toLocaleString());
    console.log('  数据:', JSON.stringify(event.data, null, 2));
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket 错误:', error.message);
  });

  ws.on('close', () => {
    console.log('❌ WebSocket 已断开');
  });

  return ws;
}

/**
 * SSE 客户端示例
 */
function sseClient() {
  console.log('=== SSE 客户端 ===');
  const eventSource = new EventSource(`${SERVER_URL}/sse`);

  eventSource.onopen = () => {
    console.log('✅ SSE 已连接');
  };

  eventSource.onmessage = (e) => {
    const event = JSON.parse(e.data);
    
    if (event.type === 'connected') {
      console.log('📡', event.message);
      return;
    }

    console.log('\n🎯 收到事件:');
    console.log('  平台:', event.platform);
    console.log('  类型:', event.type);
    console.log('  时间:', new Date(event.timestamp).toLocaleString());
    console.log('  数据:', JSON.stringify(event.data, null, 2));
  };

  eventSource.onerror = (error) => {
    console.error('❌ SSE 错误:', error);
  };

  return eventSource;
}

// 从命令行参数选择客户端类型
const clientType = process.argv[2] || 'ws';

if (clientType === 'ws') {
  const client = websocketClient();
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n正在关闭...');
    client.close();
    process.exit(0);
  });
} else if (clientType === 'sse') {
  const client = sseClient();
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n正在关闭...');
    client.close();
    process.exit(0);
  });
} else {
  console.error('未知的客户端类型:', clientType);
  console.log('用法: node client.js [ws|sse]');
  process.exit(1);
}

