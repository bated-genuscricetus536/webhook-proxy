import { FC } from 'hono/jsx';
import { Layout } from '../components/Layout';

export const Home: FC<{}> = (_props) => {
  const script = `
    // 检查是否已登录，如果有 session cookie 则自动跳转到 dashboard
    (function checkAuth() {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session' && value) {
          console.log('[Auth] Already logged in, redirecting to dashboard');
          window.location.href = '/dashboard';
          return;
        }
      }
    })();

    // Base64URL 编码/解码辅助函数
    function uint8ArrayToBase64url(array) {
      return btoa(String.fromCharCode.apply(null, array))
        .replace(/\\+/g, '-')
        .replace(/\\//g, '_')
        .replace(/=/g, '');
    }

    function base64urlToUint8Array(base64url) {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const base64Padded = base64 + padding;
      const binaryString = atob(base64Padded);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }

    // 切换登录/注册表单
    function toggleAuthMode() {
      const isLoginMode = document.getElementById('login-form').style.display !== 'none';
      document.getElementById('login-form').style.display = isLoginMode ? 'none' : 'block';
      document.getElementById('register-form').style.display = isLoginMode ? 'block' : 'none';
      document.getElementById('toggle-text').textContent = isLoginMode ? '已有账号？' : '还没有账号？';
      document.getElementById('toggle-btn').textContent = isLoginMode ? '登录' : '注册';
    }

    // 显示错误消息
    function showError(message) {
      const errorDiv = document.getElementById('error-message');
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    }

    // 用户名/密码登录
    async function handleLogin(event) {
      event.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;

      if (!username || !password) {
        showError('请输入用户名和密码');
        return;
      }

      try {
        const response = await fetch('/api/account/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '登录失败');
        }

        const result = await response.json();
        document.cookie = \`session=\${result.session_token}; Path=/; Max-Age=604800\${location.protocol === 'https:' ? '; Secure' : ''}; SameSite=Lax\`;
        window.location.href = '/dashboard';
      } catch (error) {
        showError(error.message);
      }
    }

    // 用户注册
    async function handleRegister(event) {
      event.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;

      if (!username || !email || !password || !confirmPassword) {
        showError('请填写所有字段');
        return;
      }

      if (password !== confirmPassword) {
        showError('两次输入的密码不一致');
        return;
      }

      try {
        const response = await fetch('/api/account/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '注册失败');
        }

        const result = await response.json();
        document.cookie = \`session=\${result.session_token}; Path=/; Max-Age=604800\${location.protocol === 'https:' ? '; Secure' : ''}; SameSite=Lax\`;
        window.location.href = '/dashboard';
      } catch (error) {
        showError(error.message);
      }
    }

    // Passkey 登录
    async function loginWithPasskey() {
      try {
        const optionsResponse = await fetch('/api/security/passkey/login/options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!optionsResponse.ok) {
          const error = await optionsResponse.json();
          throw new Error(error.error || 'Failed to get authentication options');
        }

        const options = await optionsResponse.json();
        options.challenge = base64urlToUint8Array(options.challenge);
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: base64urlToUint8Array(cred.id)
          }));
        }

        const credential = await navigator.credentials.get({ publicKey: options });
        if (!credential) throw new Error('No credential returned');

        // 序列化 credential 对象
        const credentialJSON = {
          id: credential.id,
          rawId: uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
          response: {
            clientDataJSON: uint8ArrayToBase64url(new Uint8Array(credential.response.clientDataJSON)),
            authenticatorData: uint8ArrayToBase64url(new Uint8Array(credential.response.authenticatorData)),
            signature: uint8ArrayToBase64url(new Uint8Array(credential.response.signature)),
            userHandle: credential.response.userHandle ? uint8ArrayToBase64url(new Uint8Array(credential.response.userHandle)) : null
          },
          type: credential.type
        };

        const verifyResponse = await fetch('/api/security/passkey/login/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: credentialJSON })
        });

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json();
          throw new Error(error.error || 'Passkey authentication failed');
        }

        const result = await verifyResponse.json();
        document.cookie = \`session=\${result.session_token}; Path=/; Max-Age=604800\${location.protocol === 'https:' ? '; Secure' : ''}; SameSite=Lax\`;
        window.location.href = '/dashboard';
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          showError('Passkey 登录被取消');
        } else {
          showError('Passkey 登录失败: ' + error.message);
        }
      }
    }
  `;

  return (
    <Layout title="Webhook Proxy" script={script}>
      <style>{`
        .auth-container {
          max-width: 560px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
        }
        .auth-card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 640px) {
          .auth-container {
            padding: 10px;
          }
          .auth-card {
            padding: 24px 20px;
            border-radius: 16px;
          }
          .auth-header h1 {
            font-size: 24px;
          }
        }
        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .auth-header h1 {
          font-size: 28px;
          color: #667eea;
          margin-bottom: 10px;
        }
        .error-message {
          background: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .btn-primary {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
        }
        .divider {
          text-align: center;
          margin: 25px 0;
          color: #64748b;
          font-size: 14px;
          position: relative;
        }
        .divider span {
          background: white;
          padding: 0 15px;
          position: relative;
          z-index: 1;
        }
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e2e8f0;
          z-index: 0;
        }
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 15px;
        }
        .oauth-buttons button {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #cbd5e1;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          transition: all 0.2s;
        }
        .oauth-buttons button:hover {
          border-color: #667eea;
          background: #f1f5f9;
          color: #667eea;
          transform: translateY(-1px);
        }
        .toggle-auth {
          text-align: center;
          margin-top: 25px;
          font-size: 14px;
          color: #64748b;
        }
        .toggle-auth button {
          color: #667eea;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }
        .features-link {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
        }
        .features-link a {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>

      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1>🚀 Webhook Proxy</h1>
            <p style="color: #64748b; font-size: 14px;">将 Webhook 转换为实时事件流</p>
          </div>

          <div id="error-message" class="error-message"></div>

          {/* 登录表单 */}
          <form id="login-form" onsubmit="handleLogin(event)" style="display: block;">
            <div class="form-group">
              <label for="login-username">用户名或邮箱</label>
              <input type="text" id="login-username" placeholder="输入用户名或邮箱" autocomplete="username" />
            </div>
            <div class="form-group">
              <label for="login-password">密码</label>
              <input type="password" id="login-password" placeholder="输入密码" autocomplete="current-password" />
            </div>
            <button type="submit" class="btn-primary">登录</button>
          </form>

          {/* 注册表单 */}
          <form id="register-form" onsubmit="handleRegister(event)" style="display: none;">
            <div class="form-group">
              <label for="register-username">用户名</label>
              <input type="text" id="register-username" placeholder="3-20个字符，字母数字" autocomplete="username" />
            </div>
            <div class="form-group">
              <label for="register-email">邮箱</label>
              <input type="email" id="register-email" placeholder="your@email.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label for="register-password">密码</label>
              <input type="password" id="register-password" placeholder="至少8位，包含大小写字母和数字" autocomplete="new-password" />
            </div>
            <div class="form-group">
              <label for="register-confirm-password">确认密码</label>
              <input type="password" id="register-confirm-password" placeholder="再次输入密码" autocomplete="new-password" />
            </div>
            <button type="submit" class="btn-primary">注册</button>
          </form>

          <div class="divider">
            <span>或使用其他方式</span>
          </div>

          <div class="oauth-buttons">
            <button onclick="loginWithPasskey()" title="使用 Passkey 登录">
              🔑 Passkey
            </button>
            <button onclick="location.href='/auth/github'" title="使用 GitHub 登录">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
            <button onclick="location.href='/auth/gitlab'" title="使用 GitLab 登录">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.919 1.263a.455.455 0 0 0-.867 0L1.388 9.452.045 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.624-8.443a.92.92 0 0 0 .331-1.024"/>
              </svg>
              GitLab
            </button>
          </div>

          <div class="toggle-auth">
            <span id="toggle-text">还没有账号？</span>
            <button type="button" id="toggle-btn" onclick="toggleAuthMode()">注册</button>
          </div>

          <div class="features-link">
            <a href="/docs">📚 查看文档</a> · <a href="/about">ℹ️ 关于项目</a>
          </div>
        </div>
      </div>
    </Layout>
  );
};
