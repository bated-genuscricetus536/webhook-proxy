/**
 * Favicon 生成脚本
 * 
 * 使用 Canvas 生成不同尺寸的 PNG，然后可以用在线工具转换为 .ico
 * 或者直接使用 PNG 作为 favicon（现代浏览器都支持）
 */

import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Logo 绘制函数
function drawLogo(canvas, size) {
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  
  // 清空画布
  ctx.clearRect(0, 0, size, size);
  
  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  // 圆角矩形背景
  const radius = size * 0.15;
  ctx.fillStyle = gradient;
  
  // 手动绘制圆角矩形
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
  
  // 保存状态并移动到中心
  ctx.save();
  ctx.translate(center, center);
  
  // 缩放因子
  const scale = size / 512;
  
  // 白色主图标
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 20 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 左侧节点
  ctx.beginPath();
  ctx.arc(-120 * scale, 0, 35 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // 右侧节点
  ctx.beginPath();
  ctx.arc(120 * scale, 0, 35 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  // 中间闪电箭头
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(-40 * scale, -80 * scale);
  ctx.lineTo(20 * scale, -20 * scale);
  ctx.lineTo(-10 * scale, -20 * scale);
  ctx.lineTo(40 * scale, 80 * scale);
  ctx.lineTo(-20 * scale, 20 * scale);
  ctx.lineTo(10 * scale, 20 * scale);
  ctx.closePath();
  ctx.fill();
  
  // 连接线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 8 * scale;
  ctx.setLineDash([15 * scale, 10 * scale]);
  
  ctx.beginPath();
  ctx.moveTo(-85 * scale, 0);
  ctx.lineTo(-55 * scale, 0);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(55 * scale, 0);
  ctx.lineTo(85 * scale, 0);
  ctx.stroke();
  
  ctx.restore();
}

// 生成 SVG
function generateSVG() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 圆角矩形背景 -->
  <rect width="512" height="512" rx="76" fill="url(#bg-gradient)"/>
  
  <!-- 左侧节点 -->
  <circle cx="136" cy="256" r="35" fill="white"/>
  
  <!-- 右侧节点 -->
  <circle cx="376" cy="256" r="35" fill="white"/>
  
  <!-- 中间闪电箭头 -->
  <path d="M 216 176 L 276 236 L 246 236 L 296 336 L 236 276 L 266 276 Z" fill="white"/>
  
  <!-- 连接线（左） -->
  <line x1="171" y1="256" x2="201" y2="256" stroke="rgba(255,255,255,0.5)" stroke-width="8" stroke-linecap="round" stroke-dasharray="15,10"/>
  
  <!-- 连接线（右） -->
  <line x1="311" y1="256" x2="341" y2="256" stroke="rgba(255,255,255,0.5)" stroke-width="8" stroke-linecap="round" stroke-dasharray="15,10"/>
</svg>`;
}

// 主函数
async function main() {
  try {
    // 创建输出目录
    const outputDir = join(__dirname, '../public');
    mkdirSync(outputDir, { recursive: true });
    
    console.log('🎨 生成 Webhook Proxy Logo...\n');
    
    // 生成不同尺寸的 PNG
    const sizes = [512, 192, 96, 48, 32, 16];
    
    for (const size of sizes) {
      const canvas = createCanvas(size, size);
      drawLogo(canvas, size);
      
      const buffer = canvas.toBuffer('image/png');
      const filename = `logo-${size}.png`;
      const filepath = join(outputDir, filename);
      
      writeFileSync(filepath, buffer);
      console.log(`✅ 生成 ${filename} (${size}×${size})`);
    }
    
    // 生成 SVG
    const svg = generateSVG();
    const svgPath = join(outputDir, 'logo.svg');
    writeFileSync(svgPath, svg);
    console.log(`✅ 生成 logo.svg (矢量)`);
    
    // 复制 32x32 作为 favicon.png
    const canvas32 = createCanvas(32, 32);
    drawLogo(canvas32, 32);
    const favicon = canvas32.toBuffer('image/png');
    const faviconPath = join(outputDir, 'favicon.png');
    writeFileSync(faviconPath, favicon);
    console.log(`✅ 生成 favicon.png (32×32)`);
    
    console.log('\n🎉 Logo 生成完成！');
    console.log(`📁 输出目录: ${outputDir}`);
    console.log('\n📝 下一步：');
    console.log('1. 查看生成的文件');
    console.log('2. 使用在线工具将 favicon.png 转换为 favicon.ico:');
    console.log('   https://www.favicon-generator.org/');
    console.log('   或 https://convertio.co/png-ico/');
    console.log('3. 将 favicon.ico 放置在 public 目录');
    
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    
    if (error.message.includes('canvas')) {
      console.log('\n💡 提示: 需要安装 canvas 依赖:');
      console.log('   npm install canvas --save-dev');
      console.log('\n或者使用浏览器版本:');
      console.log('   1. 在浏览器中打开 scripts/generate-logo.html');
      console.log('   2. 下载生成的图标文件');
    }
    
    process.exit(1);
  }
}

main();

