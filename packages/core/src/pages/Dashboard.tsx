import { FC } from 'hono/jsx';
import { DashboardLayout } from '../components/DashboardLayout';

interface DashboardProps {
  passkeyLogin?: boolean;
  cliRedirect?: string | null;
}

export const Dashboard: FC<DashboardProps> = (props) => {
  const dashboardScript = `
    const API_BASE = '';
    let sessionToken = '';
    const PASSKEY_LOGIN = ${props.passkeyLogin || false};
    const CLI_REDIRECT = ${props.cliRedirect ? `'${props.cliRedirect}'` : 'null'};

    // Base64URL 编码/解码辅助函数
    function uint8ArrayToBase64url(array) {
      return btoa(String.fromCharCode.apply(null, array))
        .replace(/\\+/g, '-')
        .replace(/\\//g, '_')
        .replace(/=/g, '');
    }

    function base64urlToUint8Array(base64url) {
      const padding = '='.repeat((4 - base64url.length % 4) % 4);
      const base64 = (base64url + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const rawData = atob(base64);
      return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    }

    // 从 URL 或 Cookie 获取 token
    function getToken() {
      if (sessionToken) {
        return sessionToken;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        sessionToken = tokenFromUrl;
        window.history.replaceState({}, document.title, '/dashboard');
        console.log('[Auth] Token loaded from URL');
        return tokenFromUrl;
      }
      
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session') {
          sessionToken = value;
          console.log('[Auth] Token loaded from cookie');
          return value;
        }
      }
      
      console.log('[Auth] No token found, redirecting to home');
      window.location.href = '/';
      return null;
    }

    // API 请求
    async function apiRequest(path, options = {}) {
      const token = sessionToken || getToken();
      if (!token) return;

      const response = await fetch(API_BASE + path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          showToast('登录已过期，请重新登录', 'error');
          setTimeout(() => window.location.href = '/', 2000);
          return null;
        }
        throw new Error(\`API Error: \${response.statusText}\`);
      }

      return response.json();
    }

    // 加载用户信息
    async function loadUserInfo() {
      try {
        const data = await apiRequest('/api/me');
        if (!data) return;

        document.getElementById('userName').textContent = data.user.username;
        document.getElementById('userEmail').textContent = data.user.email || '';
        document.getElementById('userAvatar').src = data.user.avatar_url || '';
      } catch (error) {
        console.error('Failed to load user info:', error);
        showToast('加载用户信息失败', 'error');
      }
    }

    // 加载 Proxies
    async function loadProxies() {
      document.getElementById('loading').style.display = 'block';
      try {
        const data = await apiRequest('/api/proxies');
        if (!data) return;

        document.getElementById('loading').style.display = 'none';
        
        const container = document.getElementById('proxiesList');
        
        if (data.proxies.length === 0) {
          container.innerHTML = \`
            <div class="empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <h3>还没有 Proxy</h3>
              <p>点击上方"创建 Proxy"按钮开始</p>
            </div>
          \`;
          return;
        }

        const platformIcons = {
          'github': '🐙',
          'gitlab': '🦊',
          'qqbot': '🤖',
          'telegram': '✈️',
          'stripe': '💳',
          'jenkins': '⚙️',
          'jira': '📋',
          'sentry': '🔍',
          'generic': '🔗'
        };
        
        container.innerHTML = data.proxies.map(proxy => \`
          <div class="proxy-card">
            <div class="proxy-header">
              <div class="proxy-title">\${proxy.name}</div>
              <div class="proxy-platform">\${platformIcons[proxy.platform] || ''} \${proxy.platform.toUpperCase()}</div>
            </div>
            
            <div class="proxy-stats">
              <div class="stat-item">
                <span class="stat-label">状态</span>
                <span class="stat-value">\${proxy.active ? '✅ 活跃' : '❌ 禁用'}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">事件数</span>
                <span class="stat-value">\${proxy.event_count || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">签名验证</span>
                <span class="stat-value">\${proxy.verify_signature ? '启用' : '禁用'}</span>
              </div>
              \${(proxy.platform === 'qqbot' || proxy.platform === 'telegram') && proxy.platform_app_id ? \`
              <div class="stat-item">
                <span class="stat-label">\${proxy.platform === 'telegram' ? 'Bot Token' : 'App ID'}</span>
                <span class="stat-value">\${proxy.platform === 'telegram' && proxy.platform_app_id.length > 20 ? proxy.platform_app_id.substring(0, 20) + '...' : proxy.platform_app_id}</span>
              </div>
              \` : ''}
            </div>

            <div class="proxy-urls">
              <div class="url-item">
                <span class="url-label">Webhook:</span>
                <div class="url-value">\${proxy.webhook_url}</div>
                <button class="copy-btn" onclick="copyToClipboard('\${proxy.webhook_url}')">复制</button>
              </div>
              <div class="url-item">
                <span class="url-label">WebSocket:</span>
                <div class="url-value">\${proxy.websocket_url}</div>
                <button class="copy-btn" onclick="copyToClipboard('\${proxy.websocket_url}')">复制</button>
              </div>
              <div class="url-item">
                <span class="url-label">SSE:</span>
                <div class="url-value">\${proxy.sse_url}</div>
                <button class="copy-btn" onclick="copyToClipboard('\${proxy.sse_url}')">复制</button>
              </div>
            </div>

            <div class="proxy-urls" style="margin-top: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px 0; margin-bottom: 10px;">
                <div style="font-weight: 600; color: #92400e;">🔐 认证信息</div>
                \${proxy.secrets_hidden ? \`
                  <button class="btn btn-sm" onclick="showSecretsWithAuth('\${proxy.id}')" style="font-size: 12px; padding: 4px 10px;">
                    🔓 验证查看完整
                  </button>
                \` : ''}
              </div>
              \${proxy.access_token ? \`
                <div class="url-item">
                  <span class="url-label">Access Token:</span>
                  <div class="url-value" style="\${proxy.secrets_hidden ? 'font-family: monospace; letter-spacing: 1px;' : ''}">\${proxy.access_token}</div>
                  \${!proxy.secrets_hidden ? '<button class="copy-btn" onclick="copyToClipboard(\\'' + proxy.access_token.replace(/'/g, "\\\\'") + '\\')">复制</button>' : ''}
                </div>
              \` : ''}
              \${proxy.webhook_secret ? \`
                <div class="url-item">
                  <span class="url-label">Webhook Secret:</span>
                  <div class="url-value" style="\${proxy.secrets_hidden ? 'font-family: monospace; letter-spacing: 1px;' : ''}">\${proxy.webhook_secret}</div>
                  \${!proxy.secrets_hidden ? '<button class="copy-btn" onclick="copyToClipboard(\\'' + proxy.webhook_secret.replace(/'/g, "\\\\'") + '\\')">复制</button>' : ''}
                </div>
              \` : (proxy.has_webhook_secret ? '<div style="padding: 10px 15px; color: #92400e;">Webhook Secret 已设置（需验证后查看）</div>' : '<div style="padding: 10px 15px; color: #92400e;">未设置 Webhook Secret</div>')}
              \${proxy.secrets_hidden ? \`
                <div style="padding: 10px 15px; background: #fef3c7; border-top: 1px solid #fbbf24; margin-top: 10px;">
                  <small style="color: #92400e;">💡 提示：以上为掩码显示，验证后可查看完整内容并复制</small>
                </div>
              \` : ''}
            </div>

            <div class="proxy-actions">
              <button class="btn" onclick="toggleProxy('\${proxy.id}', \${!proxy.active})">
                \${proxy.active ? '禁用' : '启用'}
              </button>
              <button class="btn btn-danger" onclick="deleteProxy('\${proxy.id}')">删除</button>
            </div>
          </div>
        \`).join('');
      } catch (error) {
        console.error('Failed to load proxies:', error);
        document.getElementById('loading').style.display = 'none';
        showToast('加载 Proxies 失败', 'error');
      }
    }

    // 创建 Proxy
    // 处理平台切换
    function handlePlatformChange() {
      const platform = document.getElementById('proxyPlatform').value;
      const appIdGroup = document.getElementById('appIdGroup');
      const appIdInput = document.getElementById('platformAppId');
      const appIdLabel = document.getElementById('appIdLabel');
      const appIdHint = document.getElementById('appIdHint');
      const webhookSecretLabel = document.getElementById('webhookSecretLabel');
      const webhookSecretInput = document.getElementById('webhookSecret');
      const webhookSecretHint = document.getElementById('webhookSecretHint');
      
      if (platform === 'qqbot') {
        // QQ Bot 需要 App ID 和 App Secret
        appIdGroup.style.display = 'block';
        appIdInput.required = true;
        appIdLabel.textContent = 'App ID *';
        appIdInput.placeholder = 'QQ Bot App ID';
        appIdHint.textContent = 'QQ Bot 的机器人 App ID';
        
        webhookSecretLabel.textContent = 'App Secret *';
        webhookSecretInput.placeholder = 'QQ Bot App Secret';
        webhookSecretInput.required = true;
        webhookSecretHint.textContent = 'QQ Bot 的机器人密钥，用于 Ed25519 签名验证';
      } else if (platform === 'telegram') {
        // Telegram 需要 Bot Token
        appIdGroup.style.display = 'block';
        appIdInput.required = true;
        appIdLabel.textContent = 'Bot Token *';
        appIdInput.placeholder = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz';
        appIdHint.textContent = 'Telegram Bot API Token（从 @BotFather 获取）';
        
        webhookSecretLabel.textContent = 'Secret Token';
        webhookSecretInput.placeholder = '留空或填写自定义 Secret Token';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = '可选的安全令牌，用于验证 Telegram 请求';
      } else if (platform === 'stripe') {
        // Stripe 不需要 App ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Webhook Signing Secret *';
        webhookSecretInput.placeholder = 'whsec_...';
        webhookSecretInput.required = true;
        webhookSecretHint.textContent = 'Stripe Webhook 签名密钥（从 Stripe Dashboard 获取）';
      } else if (platform === 'jenkins') {
        // Jenkins 不需要 App ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Authentication Token';
        webhookSecretInput.placeholder = '留空或填写认证 Token（可选）';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = '可选的认证令牌（支持 URL 参数或 Authorization 头）';
      } else if (platform === 'jira') {
        // Jira 不需要 App ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Webhook Secret';
        webhookSecretInput.placeholder = '留空或填写 Secret（可选）';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = '可选的 Webhook Secret，用于 HMAC-SHA256 签名验证';
      } else if (platform === 'sentry') {
        // Sentry 不需要 App ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Client Secret';
        webhookSecretInput.placeholder = '留空或填写 Client Secret（可选）';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = 'Sentry Integration 的 Client Secret，用于签名验证';
      } else if (platform === 'generic') {
        // Generic Webhook 不需要 App ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Authorization Token';
        webhookSecretInput.placeholder = '留空则不验证（可选）';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = '可选的认证令牌，支持 Bearer Token 或直接传入 Token';
      } else {
        // GitHub/GitLab 不需要额外的 ID
        appIdGroup.style.display = 'none';
        appIdInput.required = false;
        appIdInput.value = '';
        
        webhookSecretLabel.textContent = 'Webhook Secret';
        webhookSecretInput.placeholder = '留空则不验证签名';
        webhookSecretInput.required = false;
        webhookSecretHint.textContent = '用于验证 webhook 请求签名（可选）';
      }
    }

    async function createProxy(event) {
      event.preventDefault();
      
      const name = document.getElementById('proxyName').value;
      const platform = document.getElementById('proxyPlatform').value;
      const webhookSecret = document.getElementById('webhookSecret').value;
      const verifySignature = document.getElementById('verifySignature').checked;
      const platformAppId = document.getElementById('platformAppId').value;

      // QQ Bot 平台验证
      if (platform === 'qqbot') {
        if (!platformAppId || !webhookSecret) {
          showToast('QQ Bot 需要填写 App ID 和 App Secret', 'error');
          return;
        }
      }
      
      // Telegram 平台验证
      if (platform === 'telegram') {
        if (!platformAppId) {
          showToast('Telegram 需要填写 Bot Token', 'error');
          return;
        }
      }

      try {
        const requestBody = {
          name,
          platform,
          webhook_secret: webhookSecret || undefined,
          verify_signature: verifySignature,
        };
        
        // QQ Bot 和 Telegram 需要 platform_app_id
        if ((platform === 'qqbot' || platform === 'telegram') && platformAppId) {
          requestBody.platform_app_id = platformAppId;
        }

        const data = await apiRequest('/api/proxies', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        });

        if (data) {
          showToast('Proxy 创建成功！', 'success');
          closeCreateModal();
          loadProxies();
        }
      } catch (error) {
        console.error('Failed to create proxy:', error);
        showToast('创建失败', 'error');
      }
    }

    // 切换 Proxy 状态
    async function toggleProxy(id, active) {
      try {
        await apiRequest(\`/api/proxies/\${id}\`, {
          method: 'PUT',
          body: JSON.stringify({ active }),
        });
        showToast('状态更新成功', 'success');
        loadProxies();
      } catch (error) {
        console.error('Failed to toggle proxy:', error);
        showToast('更新失败', 'error');
      }
    }

    // 删除 Proxy
    async function deleteProxy(id) {
      if (!confirm('确定要删除这个 Proxy 吗？此操作不可恢复。')) {
        return;
      }

      try {
        await apiRequest(\`/api/proxies/\${id}\`, {
          method: 'DELETE',
        });
        showToast('Proxy 已删除', 'success');
        loadProxies();
      } catch (error) {
        console.error('Failed to delete proxy:', error);
        showToast('删除失败', 'error');
      }
    }

    // Modal 控制
    function showCreateModal() {
      document.getElementById('createModal').classList.add('active');
      document.getElementById('createForm').reset();
    }

    function closeCreateModal() {
      document.getElementById('createModal').classList.remove('active');
    }

    // 复制到剪贴板
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板', 'success');
      }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('复制失败', 'error');
      });
    }

    // Toast 提示
    function showToast(message, type = 'success') {
      const toast = document.getElementById('toast');
      const toastMessage = document.getElementById('toastMessage');
      
      toast.className = 'toast ' + type + ' show';
      toastMessage.textContent = message;
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    // 退出登录
    function logout() {
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      window.location.href = '/auth/logout';
    }

    // 页面加载
              // Base64URL 解码为 Uint8Array
              function base64urlToUint8Array(base64url) {
                // 将 base64url 转换为标准 base64
                const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
                const padding = '='.repeat((4 - base64.length % 4) % 4);
                const base64Padded = base64 + padding;
                
                // 解码 base64
                const binaryString = atob(base64Padded);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
              }

              // 验证后查看 Secrets
              async function showSecretsWithAuth(proxyId) {
                const token = getToken();
                if (!token) {
                  alert('未登录');
                  return;
                }

                try {
                  // 1. 获取安全设置状态
                  const settingsResponse = await fetch('/api/security/settings', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                  });
                  
                  if (!settingsResponse.ok) {
                    throw new Error('Failed to get security settings');
                  }
                  
                  const settings = await settingsResponse.json();
                  
                  let verified = false;
                  let verifyPayload = {};
                  
                  // 2. 根据启用的验证方式进行验证
                  let verifyMethod = '';
                  
                  // 如果两者都启用，让用户选择
                  if (settings.mfa_enabled && settings.passkey_enabled) {
                    const choice = confirm('选择验证方式：\\n\\n点击"确定"使用 MFA（验证码）\\n点击"取消"使用 Passkey（生物识别）');
                    verifyMethod = choice ? 'mfa' : 'passkey';
                  } else if (settings.mfa_enabled) {
                    verifyMethod = 'mfa';
                  } else if (settings.passkey_enabled) {
                    verifyMethod = 'passkey';
                  } else {
                    alert('未启用 MFA 或 Passkey');
                    return;
                  }
                  
                  if (verifyMethod === 'mfa') {
                    // MFA 验证
                    const mfaToken = prompt('请输入 MFA 验证码（6 位数字）：');
                    if (!mfaToken) return;
                    
                    verifyPayload = {
                      method: 'mfa',
                      token: mfaToken
                    };
                  } else if (verifyMethod === 'passkey') {
                    // Passkey 验证
                    // 获取认证选项
                    const optionsResponse = await fetch('/api/security/passkey/auth/options', {
                      method: 'POST',
                      headers: {
                        'Authorization': \`Bearer \${token}\`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (!optionsResponse.ok) {
                      throw new Error('Failed to get auth options');
                    }
                    
                    const options = await optionsResponse.json();
                    
                    // 转换 base64url 字段为 Uint8Array
                    options.challenge = base64urlToUint8Array(options.challenge);
                    if (options.allowCredentials) {
                      options.allowCredentials = options.allowCredentials.map(cred => ({
                        ...cred,
                        id: base64urlToUint8Array(cred.id)
                      }));
                    }
                    
                    // 调用 WebAuthn API
                    const credential = await navigator.credentials.get({
                      publicKey: options
                    });
                    
                    if (!credential) {
                      throw new Error('No credential returned');
                    }
                    
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
                    
                    verifyPayload = {
                      method: 'passkey',
                      response: credentialJSON
                    };
                  }
                  
                  // 3. 验证并获取 secrets
                  const verifyResponse = await fetch('/api/security/verify-and-show-secrets', {
                    method: 'POST',
                    headers: {
                      'Authorization': \`Bearer \${token}\`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(verifyPayload)
                  });
                  
                  if (!verifyResponse.ok) {
                    const error = await verifyResponse.json();
                    throw new Error(error.error || 'Verification failed');
                  }
                  
                  const data = await verifyResponse.json();
                  
                  // 4. 显示 secrets
                  displaySecrets(data.secrets);
                  showToast('验证成功！Secrets 已显示', 'success');
                  
                } catch (error) {
                  console.error('Verification error:', error);
                  if (error.name === 'NotAllowedError') {
                    showToast('Passkey 验证被取消', 'error');
                  } else {
                    showToast('验证失败: ' + error.message, 'error');
                  }
                }
              }
    
    // 显示获取到的 secrets
    function displaySecrets(secrets) {
      // 创建模态框显示 secrets
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'flex';
      modal.innerHTML = \`
        <div class="modal-content">
          <h3 style="color: #667eea; margin-bottom: 20px;">🔐 Secrets</h3>
          <div style="max-height: 400px; overflow-y: auto;">
            \${secrets.map(secret => \`
              <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 2px solid #e2e8f0;">
                <div style="font-weight: 600; margin-bottom: 10px; color: #1e293b;">Proxy ID: \${secret.id}</div>
                \${secret.access_token ? \`
                  <div style="margin-bottom: 10px;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Access Token:</div>
                    <div style="font-family: monospace; font-size: 13px; background: white; padding: 8px; border-radius: 6px; word-break: break-all;">
                      \${secret.access_token}
                      <button class="copy-btn" onclick="copyToClipboard('\${secret.access_token}')" style="margin-left: 8px;">复制</button>
                    </div>
                  </div>
                \` : ''}
                \${secret.webhook_secret ? \`
                  <div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Webhook Secret:</div>
                    <div style="font-family: monospace; font-size: 13px; background: white; padding: 8px; border-radius: 6px; word-break: break-all;">
                      \${secret.webhook_secret}
                      <button class="copy-btn" onclick="copyToClipboard('\${secret.webhook_secret}')" style="margin-left: 8px;">复制</button>
                    </div>
                  </div>
                \` : '<div style="color: #64748b; font-size: 14px;">未设置 Webhook Secret</div>'}
              </div>
            \`).join('')}
          </div>
          <div style="margin-top: 20px; text-align: right;">
            <button class="btn" onclick="this.closest('.modal').remove()">关闭</button>
          </div>
        </div>
      \`;
      document.body.appendChild(modal);
      
      // 点击外部关闭
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }

    // CLI Passkey 登录函数
    async function performCliPasskeyLogin() {
      try {
        showToast('正在启动 Passkey 登录...', 'info');
        
        // 1. 获取 Passkey 认证选项（不需要认证）
        const optionsResponse = await fetch('/api/security/passkey/login/options', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!optionsResponse.ok) {
          throw new Error('获取认证选项失败');
        }
        
        const { options } = await optionsResponse.json();
        
        // 转换 challenge 和 allowCredentials
        if (typeof options.challenge === 'string') {
          options.challenge = base64urlToUint8Array(options.challenge);
        }
        
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: base64urlToUint8Array(cred.id)
          }));
        }
        
        showToast('请使用您的 Passkey 进行认证...', 'info');
        
        // 2. 调用 WebAuthn API
        const credential = await navigator.credentials.get({
          publicKey: options
        });
        
        if (!credential) {
          throw new Error('未获取到凭据');
        }
        
        // 3. 转换响应为 JSON 格式
        const credentialJSON = {
          id: credential.id,
          rawId: uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
          response: {
            authenticatorData: uint8ArrayToBase64url(new Uint8Array(credential.response.authenticatorData)),
            clientDataJSON: uint8ArrayToBase64url(new Uint8Array(credential.response.clientDataJSON)),
            signature: uint8ArrayToBase64url(new Uint8Array(credential.response.signature)),
            userHandle: credential.response.userHandle ? uint8ArrayToBase64url(new Uint8Array(credential.response.userHandle)) : null
          },
          type: credential.type
        };
        
        showToast('正在验证...', 'info');
        
        // 4. 验证认证
        const verifyResponse = await fetch('/api/security/passkey/login/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ response: credentialJSON })
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || '验证失败');
        }
        
        const verifyData = await verifyResponse.json();
        const sessionToken = verifyData.session_token;
        
        if (!sessionToken) {
          throw new Error('未收到 session token');
        }
        
        showToast('登录成功！正在重定向...', 'success');
        
        // 5. 如果有 CLI 回调地址，重定向到 CLI
        if (CLI_REDIRECT) {
          const redirectUrl = new URL(CLI_REDIRECT);
          redirectUrl.searchParams.set('token', sessionToken);
          window.location.href = redirectUrl.toString();
        } else {
          // 如果没有 CLI 回调，保存 token 并刷新页面
          window.location.href = \`/dashboard?token=\${sessionToken}\`;
        }
        
      } catch (error) {
        console.error('CLI Passkey login error:', error);
        if (error.name === 'NotAllowedError') {
          showToast('Passkey 验证被取消', 'error');
        } else {
          showToast('Passkey 登录失败: ' + error.message, 'error');
        }
        
        // 如果登录失败且有 CLI 回调，也要通知 CLI
        if (CLI_REDIRECT) {
          const redirectUrl = new URL(CLI_REDIRECT);
          redirectUrl.searchParams.set('error', error.message || 'Passkey login failed');
          setTimeout(() => {
            window.location.href = redirectUrl.toString();
          }, 2000);
        }
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      // 如果是 CLI Passkey 登录模式
      if (PASSKEY_LOGIN && CLI_REDIRECT) {
        performCliPasskeyLogin();
      } else if (getToken()) {
        loadUserInfo();
        loadProxies();
      }
    });

    // 点击 modal 外部关闭
    document.getElementById('createModal').addEventListener('click', (e) => {
      if (e.target.id === 'createModal') {
        closeCreateModal();
      }
    });
  `;

  return (
    <DashboardLayout>
      <div class="container">
        {/* Header */}
        <div class="header">
          <div class="user-info">
            <img src="" alt="Avatar" class="avatar" id="userAvatar" />
            <div class="user-details">
              <h2 id="userName">加载中...</h2>
              <p id="userEmail"></p>
            </div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn" onclick="window.location.href='/settings'" style="background: #10b981;">⚙️ 安全设置</button>
            <button class="btn btn-danger" onclick="logout()">退出登录</button>
          </div>
        </div>

        {/* Content */}
        <div class="content">
          <div class="section-title">
            <span>我的 Proxies</span>
            <button class="btn btn-success" onclick="showCreateModal()">+ 创建 Proxy</button>
          </div>

          <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>

          <div id="proxiesList" class="proxies-grid"></div>
        </div>
      </div>

      {/* Create Proxy Modal */}
      <div id="createModal" class="modal">
        <div class="modal-content">
          <h2 style="color: #667eea; margin-bottom: 20px;">创建新 Proxy</h2>
          <form id="createForm" onsubmit="createProxy(event)">
            <div class="form-group">
              <label for="proxyName">名称 *</label>
              <input type="text" id="proxyName" required placeholder="例如: My GitHub Project" />
            </div>
            
            <div class="form-group">
              <label for="proxyPlatform">平台 *</label>
              <select id="proxyPlatform" required onchange="handlePlatformChange()">
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="qqbot">QQ Bot</option>
                <option value="telegram">Telegram</option>
                <option value="stripe">Stripe</option>
                <option value="jenkins">Jenkins</option>
                <option value="jira">Jira</option>
                <option value="sentry">Sentry</option>
                <option value="generic">Generic Webhook</option>
              </select>
            </div>
            
            <div class="form-group" id="appIdGroup" style="display: none;">
              <label for="platformAppId" id="appIdLabel">App ID *</label>
              <input type="text" id="platformAppId" placeholder="平台特定 ID" />
              <small id="appIdHint">平台特定的标识符</small>
            </div>
            
            <div class="form-group">
              <label for="webhookSecret" id="webhookSecretLabel">Webhook Secret</label>
              <input type="text" id="webhookSecret" placeholder="留空则不验证签名" />
              <small id="webhookSecretHint">用于验证 webhook 请求签名（可选）</small>
            </div>
            
            <div class="form-group checkbox-group">
              <input type="checkbox" id="verifySignature" />
              <label for="verifySignature" style="margin: 0;">启用签名验证</label>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 30px;">
              <button type="button" class="btn" onclick="closeCreateModal()">取消</button>
              <button type="submit" class="btn btn-success">创建</button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      <div id="toast" class="toast">
        <span id="toastMessage"></span>
      </div>

      {/* GitHub Footer */}
      <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); text-align: center;">
        <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">
          ⭐ 这是一个开源项目，如果觉得有用，请给我们一个 Star
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a 
            href="https://github.com/lc-cn/webhook-proxy" 
            target="_blank" 
            rel="noopener"
            style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #24292e; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s;"
            onmouseover="this.style.background='#1a1e22'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#24292e'; this.style.transform='translateY(0)'"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            ⭐ Star on GitHub
          </a>
          <a 
            href="https://www.npmjs.com/package/webhook-proxy-cli" 
            target="_blank" 
            rel="noopener"
            style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #667eea; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s;"
            onmouseover="this.style.background='#5568d3'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#667eea'; this.style.transform='translateY(0)'"
          >
            💻 CLI 工具
          </a>
          <a 
            href="/docs" 
            style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #10b981; color: white; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: all 0.2s;"
            onmouseover="this.style.background='#059669'; this.style.transform='translateY(-2px)'"
            onmouseout="this.style.background='#10b981'; this.style.transform='translateY(0)'"
          >
            📚 查看文档
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">
          <a href="https://github.com/lc-cn/webhook-proxy/issues" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none;">报告 Bug</a> · 
          <a href="https://github.com/lc-cn/webhook-proxy/pulls" target="_blank" rel="noopener" style="color: #667eea; text-decoration: none;">贡献代码</a> · 
          <a href="/about" style="color: #667eea; text-decoration: none;">关于项目</a>
        </p>
      </div>

      <script dangerouslySetInnerHTML={{ __html: dashboardScript }} />
    </DashboardLayout>
  );
};

