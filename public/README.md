# 📦 Public Assets

这个目录包含项目的公共资源文件。

## 🎨 Logo 文件

### SVG 格式

- **`logo.svg`** (512×512) - 高质量矢量 Logo
  - 适用于：网站展示、社交媒体分享、文档
  - 特点：无限缩放不失真
  
- **`favicon.svg`** (32×32) - 简化版 Favicon
  - 适用于：浏览器标签页图标
  - 特点：小尺寸优化，清晰可见

### Logo 设计说明

**设计元素：**
- 🎨 紫色渐变背景（#667eea → #764ba2）
- ⚡ 中间闪电符号：代表快速、实时的数据传输
- 🔵 两侧圆点：代表数据源和目标端点
- 📡 虚线连接：表示 Webhook 的代理和转发功能

**设计理念：**
- 简洁现代的扁平化风格
- 符合 Webhook 代理的技术特性
- 高辨识度，易于记忆

## 📝 使用方法

### 在 HTML 中引用

```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Logo 展示 -->
<img src="/logo.svg" alt="Webhook Proxy Logo" width="200" />
```

### 生成其他格式

如果需要 PNG 或 ICO 格式：

1. **浏览器方式**：
   - 打开 `scripts/generate-logo.html`
   - 在浏览器中下载所需尺寸

2. **Node.js 方式**（需要安装 canvas）：
   ```bash
   npm install canvas --save-dev
   node scripts/generate-favicon.js
   ```

3. **在线转换**：
   - SVG → PNG: https://cloudconvert.com/svg-to-png
   - PNG → ICO: https://www.favicon-generator.org/

## 🎯 推荐尺寸

| 用途 | 尺寸 | 格式 |
|------|------|------|
| Favicon | 32×32 | SVG/ICO |
| Apple Touch Icon | 180×180 | PNG |
| Android Chrome | 192×192, 512×512 | PNG |
| Open Graph | 1200×630 | PNG |
| Twitter Card | 1200×675 | PNG |

## 📜 License

Logo 与项目共享相同的 MIT 许可证。

---

**Created for Webhook Proxy** ⚡  
Simple, Modern, Powerful

