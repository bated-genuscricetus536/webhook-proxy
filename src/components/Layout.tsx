import { FC } from 'hono/jsx';

interface LayoutProps {
  title?: string;
  children: any;
  script?: string;
}

export const Layout: FC<LayoutProps> = ({ title = 'Webhook Proxy', children, script }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/svg+xml" href="/logo.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        
        {/* Meta Tags */}
        <meta name="description" content="开源 webhook 代理方案，通过适配器将各种平台的 webhook 事件转换为 WebSocket 或 SSE 事件" />
        <meta name="theme-color" content="#667eea" />
        
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
          }
          .container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
          }
          h1 { color: #667eea; font-size: 2.5em; margin-bottom: 20px; }
          p { color: #64748b; font-size: 1.1em; margin-bottom: 40px; line-height: 1.6; }
          .buttons { display: flex; flex-direction: column; gap: 15px; }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          button:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
          button svg { width: 24px; height: 24px; }
          .features {
            margin-top: 40px;
            padding-top: 40px;
            border-top: 2px solid #e2e8f0;
            text-align: left;
          }
          .features h2 { color: #667eea; font-size: 1.3em; margin-bottom: 15px; }
          .features ul { list-style: none; }
          .features li {
            color: #64748b;
            padding: 8px 0;
            padding-left: 30px;
            position: relative;
          }
          .features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
          }
          .badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 20px;
            font-weight: bold;
          }
        `}</style>
        {script && <script dangerouslySetInnerHTML={{ __html: script }} />}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
};

