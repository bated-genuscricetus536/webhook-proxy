import { FC } from 'hono/jsx';

interface DashboardLayoutProps {
  children: any;
  scripts?: string;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children, scripts }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Dashboard - Webhook Proxy</title>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid #667eea;
          }
          .user-details h2 { color: #667eea; margin-bottom: 5px; }
          .user-details p { color: #64748b; font-size: 0.9em; }
          .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
          }
          .btn:hover { background: #5568d3; transform: translateY(-2px); }
          .btn-danger { background: #ef4444; }
          .btn-danger:hover { background: #dc2626; }
          .btn-success { background: #10b981; }
          .btn-success:hover { background: #059669; }
          .content {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          .section-title {
            color: #667eea;
            font-size: 1.5em;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .proxies-grid {
            display: grid;
            gap: 20px;
          }
          .proxy-card {
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s;
          }
          .proxy-card:hover {
            border-color: #667eea;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
          }
          .proxy-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          .proxy-title {
            font-size: 1.2em;
            color: #1e293b;
            font-weight: 600;
          }
          .proxy-platform {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
          }
          .proxy-urls {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .url-item {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .url-item:last-child { margin-bottom: 0; }
          .url-label {
            font-weight: 600;
            color: #64748b;
            min-width: 100px;
            font-size: 0.9em;
          }
          .url-value {
            flex: 1;
            color: #1e293b;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.85em;
            background: white;
            padding: 8px 12px;
            border-radius: 5px;
            border: 1px solid #e2e8f0;
            overflow-x: auto;
            white-space: nowrap;
          }
          .copy-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.3s;
          }
          .copy-btn:hover { background: #5568d3; }
          .proxy-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .proxy-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
            padding: 10px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .stat-item {
            display: flex;
            flex-direction: column;
          }
          .stat-label { font-size: 0.85em; color: #64748b; }
          .stat-value { font-size: 1.2em; font-weight: 600; color: #667eea; }
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
          }
          .empty-state svg {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            opacity: 0.3;
          }
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
          }
          .modal.active { display: flex; }
          .modal-content {
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #1e293b;
            font-weight: 600;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1em;
            transition: all 0.3s;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
          }
          .form-group small {
            display: block;
            margin-top: 5px;
            color: #64748b;
            font-size: 0.85em;
          }
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .checkbox-group input[type="checkbox"] {
            width: auto;
          }
          .loading {
            display: none;
            text-align: center;
            padding: 20px;
          }
          .spinner {
            border: 3px solid #f3f4f6;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: none;
            align-items: center;
            gap: 10px;
            z-index: 2000;
          }
          .toast.show { display: flex; }
          .toast.success { border-left: 4px solid #10b981; }
          .toast.error { border-left: 4px solid #ef4444; }
        `}</style>
      </head>
      <body>
        {children}
        {scripts && <script dangerouslySetInnerHTML={{ __html: scripts }} />}
      </body>
    </html>
  );
};

