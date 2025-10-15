import { FC } from 'hono/jsx';
import { DashboardLayout } from '../components/DashboardLayout';

export const Dashboard: FC<{}> = (_props) => {
  const dashboardScript = `
    const API_BASE = '';
    let sessionToken = '';

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

        container.innerHTML = data.proxies.map(proxy => \`
          <div class="proxy-card">
            <div class="proxy-header">
              <div class="proxy-title">\${proxy.name}</div>
              <div class="proxy-platform">\${proxy.platform}</div>
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
    async function createProxy(event) {
      event.preventDefault();
      
      const name = document.getElementById('proxyName').value;
      const platform = document.getElementById('proxyPlatform').value;
      const webhookSecret = document.getElementById('webhookSecret').value;
      const verifySignature = document.getElementById('verifySignature').checked;

      try {
        const data = await apiRequest('/api/proxies', {
          method: 'POST',
          body: JSON.stringify({
            name,
            platform,
            webhook_secret: webhookSecret || undefined,
            verify_signature: verifySignature,
          }),
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
                  if (settings.mfa_enabled) {
                    // MFA 验证
                    const mfaToken = prompt('请输入 MFA 验证码（6 位数字）：');
                    if (!mfaToken) return;
                    
                    verifyPayload = {
                      method: 'mfa',
                      token: mfaToken
                    };
                  } else if (settings.passkey_enabled) {
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
                    
                    verifyPayload = {
                      method: 'passkey',
                      response: credential
                    };
                  } else {
                    alert('未启用 MFA 或 Passkey');
                    return;
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

    window.addEventListener('DOMContentLoaded', () => {
      if (getToken()) {
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
              <select id="proxyPlatform" required>
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="webhookSecret">Webhook Secret</label>
              <input type="text" id="webhookSecret" placeholder="留空则不验证签名" />
              <small>用于验证 webhook 请求签名（可选）</small>
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

      <script dangerouslySetInnerHTML={{ __html: dashboardScript }} />
    </DashboardLayout>
  );
};

