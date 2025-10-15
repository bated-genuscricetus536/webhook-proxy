import { DashboardLayout } from '../components/DashboardLayout';

export const Settings = () => {
  return (
    <DashboardLayout
      scripts={`
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

        // 获取 session token
        function getSessionToken() {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'session') {
              return value;
            }
          }
          return null;
        }

        // 加载账户设置
        async function loadAccountSettings() {
          const token = getSessionToken();
          if (!token) {
            alert('请先登录');
            setTimeout(() => { window.location.href = '/'; }, 1000);
            return;
          }

          try {
            const response = await fetch('/api/account/settings', {
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load account settings');
            }

            const data = await response.json();
            updateAccountUI(data);
            
            // 同时加载安全设置（MFA/Passkey）
            loadSecuritySettings();
          } catch (error) {
            console.error('Error loading settings:', error);
            alert('加载设置失败');
          }
        }

        // 加载安全设置（MFA/Passkey）
        async function loadSecuritySettings() {
          const token = getSessionToken();
          try {
            const response = await fetch('/api/security/settings', {
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to load security settings');
            }

            const data = await response.json();
            
            // 更新 MFA 状态
            document.getElementById('mfa-status').textContent = data.mfa_enabled ? '已启用 ✅' : '未启用';
            document.getElementById('setup-mfa-btn').style.display = data.mfa_enabled ? 'none' : 'inline-block';
            document.getElementById('disable-mfa-btn').style.display = data.mfa_enabled ? 'inline-block' : 'none';
            
            // 更新 Passkey 状态
            document.getElementById('passkey-status').textContent = data.passkey_enabled ? '已启用 ✅' : '未启用';
            document.getElementById('setup-passkey-btn').style.display = data.passkey_enabled ? 'none' : 'inline-block';
            document.getElementById('manage-passkeys-btn').style.display = data.passkey_enabled ? 'inline-block' : 'none';
            
            // 如果启用了 Passkey，加载列表；否则清空列表
            if (data.passkey_enabled) {
              loadPasskeys();
            } else {
              // 清空 Passkey 列表显示
              const passkeyList = document.getElementById('passkey-list');
              if (passkeyList) {
                passkeyList.innerHTML = '<li style="text-align: center; color: #94a3b8;">暂无 Passkey</li>';
              }
            }
          } catch (error) {
            console.error('Error loading security settings:', error);
          }
        }

        // 更新账户信息 UI
        function updateAccountUI(data) {
          const { user, oauth_bindings } = data;
          
          // 显示账户信息
          document.getElementById('account-username').textContent = user.username;
          document.getElementById('account-email').textContent = user.email || '未设置';
          
          // 显示邮箱验证状态
          const emailBadge = document.getElementById('email-verified-badge');
          if (user.email) {
            if (user.email_verified) {
              emailBadge.innerHTML = ' <span style="color: #10b981; font-weight: 600;">✅ 已验证</span>';
              document.getElementById('email-action-btn').textContent = '修改邮箱';
            } else {
              emailBadge.innerHTML = ' <span style="color: #f59e0b; font-weight: 600;">⚠️ 未验证</span>';
              document.getElementById('email-action-btn').textContent = '验证邮箱';
            }
          } else {
            emailBadge.innerHTML = '';
            document.getElementById('email-action-btn').textContent = '设置邮箱';
          }
          
          document.getElementById('account-created').textContent = new Date(user.created_at).toLocaleString();
          
          // 显示密码状态
          document.getElementById('password-status').textContent = user.has_password ? '已设置 ✅' : '未设置';
          document.getElementById('password-action').textContent = user.has_password ? '修改密码' : '设置密码';
          
          // 显示 OAuth 绑定
          const oauthList = document.getElementById('oauth-bindings-list');
          oauthList.innerHTML = '';
          
          if (oauth_bindings.length === 0) {
            oauthList.innerHTML = '<li style="color: #64748b;">暂无绑定的第三方账号</li>';
          } else {
            oauth_bindings.forEach(binding => {
              const li = document.createElement('li');
              li.className = 'binding-item';
              li.innerHTML = \`
                <div class="binding-info">
                  <div class="binding-platform">\${binding.platform === 'github' ? 'GitHub' : 'GitLab'}</div>
                  <div class="binding-username">@\${binding.platform_username}</div>
                  <div class="binding-date">绑定于 \${new Date(binding.created_at).toLocaleDateString()}</div>
                </div>
                <button class="btn btn-sm btn-danger" onclick="unbindOAuth('\${binding.id}')">解绑</button>
              \`;
              oauthList.appendChild(li);
            });
          }
          
          // 更新绑定按钮状态
          const githubBound = oauth_bindings.some(b => b.platform === 'github');
          const gitlabBound = oauth_bindings.some(b => b.platform === 'gitlab');
          
          document.getElementById('bind-github-btn').disabled = githubBound;
          document.getElementById('bind-github-btn').textContent = githubBound ? 'GitHub (已绑定)' : '绑定 GitHub';
          
          document.getElementById('bind-gitlab-btn').disabled = gitlabBound;
          document.getElementById('bind-gitlab-btn').textContent = gitlabBound ? 'GitLab (已绑定)' : '绑定 GitLab';
        }

        // 绑定 OAuth
        async function bindOAuth(platform) {
          const token = getSessionToken();
          try {
            const response = await fetch(\`/api/account/settings/bind-oauth/\${platform}\`, {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              throw new Error('Failed to get auth URL');
            }

            const data = await response.json();
            window.location.href = data.auth_url;
          } catch (error) {
            console.error('Error:', error);
            alert('绑定失败: ' + error.message);
          }
        }

        // 解绑 OAuth
        async function unbindOAuth(bindingId) {
          if (!confirm('确定要解绑此账号吗？')) {
            return;
          }

          const token = getSessionToken();
          try {
            const response = await fetch(\`/api/account/settings/oauth-binding/\${bindingId}\`, {
              method: 'DELETE',
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to unbind');
            }

            alert('解绑成功！');
            loadAccountSettings();
          } catch (error) {
            console.error('Error:', error);
            alert('解绑失败: ' + error.message);
          }
        }

        // 修改密码
        async function changePassword() {
          const currentPassword = document.getElementById('current-password').value;
          const newPassword = document.getElementById('new-password').value;
          const confirmPassword = document.getElementById('confirm-password').value;

          if (newPassword !== confirmPassword) {
            alert('两次输入的新密码不一致');
            return;
          }

          if (!newPassword) {
            alert('请输入新密码');
            return;
          }

          const token = getSessionToken();
          try {
            const response = await fetch('/api/account/settings/change-password', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                current_password: currentPassword || undefined,
                new_password: newPassword
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to change password');
            }

            alert('密码修改成功！');
            document.getElementById('password-modal').style.display = 'none';
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            loadAccountSettings();
          } catch (error) {
            console.error('Error:', error);
            alert('修改密码失败: ' + error.message);
          }
        }

        // 打开修改密码模态框
        function openPasswordModal() {
          document.getElementById('password-modal').style.display = 'flex';
        }

        // 关闭修改密码模态框
        function closePasswordModal() {
          document.getElementById('password-modal').style.display = 'none';
        }

        // ========== 邮箱设置功能 ==========
        
        // 打开邮箱设置模态框
        function openEmailModal() {
          document.getElementById('email-modal').style.display = 'flex';
          document.getElementById('email-verification-section').style.display = 'none';
        }
        
        // 关闭邮箱设置模态框
        function closeEmailModal() {
          document.getElementById('email-modal').style.display = 'none';
          document.getElementById('email-input').value = '';
          document.getElementById('verification-code-input').value = '';
          document.getElementById('email-verification-section').style.display = 'none';
        }
        
        // 发送验证码
        async function sendVerificationCode() {
          const email = document.getElementById('email-input').value;
          
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('请输入有效的邮箱地址');
            return;
          }
          
          const token = getSessionToken();
          try {
            const response = await fetch('/api/account/settings/send-verification-code', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email })
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to send verification code');
            }
            
            const data = await response.json();
            
            // 显示验证码输入区域
            document.getElementById('email-verification-section').style.display = 'block';
            
            // 显示调试验证码（仅开发环境）
            const debugCodeDisplay = document.getElementById('debug-code-display');
            if (data.debug_code) {
              debugCodeDisplay.textContent = '🔑 验证码（开发模式）: ' + data.debug_code;
              debugCodeDisplay.style.display = 'block';
            } else {
              debugCodeDisplay.style.display = 'none';
            }
            
            alert(data.message || '验证码已发送到您的邮箱，请查收！');
          } catch (error) {
            console.error('Error:', error);
            alert('发送验证码失败: ' + error.message);
          }
        }
        
        // 验证邮箱
        async function verifyEmail() {
          const code = document.getElementById('verification-code-input').value;
          
          if (!code || code.length !== 6) {
            alert('请输入 6 位验证码');
            return;
          }
          
          const token = getSessionToken();
          try {
            const response = await fetch('/api/account/settings/verify-email', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ code })
            });
            
            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to verify email');
            }
            
            alert('邮箱验证成功！');
            closeEmailModal();
            loadAccountSettings();
          } catch (error) {
            console.error('Error:', error);
            alert('验证失败: ' + error.message);
          }
        }

        // ========== MFA 功能 ==========
        
        // 设置 MFA
        async function setupMFA() {
          const token = getSessionToken();
          try {
            const response = await fetch('/api/security/mfa/setup', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              throw new Error('Failed to setup MFA');
            }

            const data = await response.json();
            
            // 生成二维码
            const qrcodeContainer = document.getElementById('mfa-qr-code');
            qrcodeContainer.innerHTML = ''; // 清空之前的内容
            
            // 使用 QRCode.js 生成二维码
            new QRCode(qrcodeContainer, {
              text: data.qr_uri,
              width: 256,
              height: 256,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
            
            // 显示 secret（用于手动输入）
            document.getElementById('mfa-secret').textContent = data.secret;
            document.getElementById('mfa-setup-modal').style.display = 'flex';
          } catch (error) {
            console.error('Error:', error);
            alert('设置 MFA 失败');
          }
        }

        // 验证并启用 MFA
        async function verifyMFA() {
          const token = getSessionToken();
          const mfaToken = document.getElementById('mfa-token-input').value;

          if (!mfaToken || mfaToken.length !== 6) {
            alert('请输入 6 位验证码');
            return;
          }

          try {
            const response = await fetch('/api/security/mfa/verify', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ token: mfaToken })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Verification failed');
            }

            alert('MFA 已成功启用！');
            document.getElementById('mfa-setup-modal').style.display = 'none';
            document.getElementById('mfa-token-input').value = '';
            loadSecuritySettings();
          } catch (error) {
            console.error('Error:', error);
            alert('MFA 启用失败: ' + error.message);
          }
        }

        // 禁用 MFA
        async function disableMFA() {
          const mfaToken = prompt('请输入当前的 MFA 验证码以确认禁用：');
          if (!mfaToken) return;

          const token = getSessionToken();
          try {
            const response = await fetch('/api/security/mfa/disable', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ token: mfaToken })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to disable MFA');
            }

            alert('MFA 已成功禁用！');
            loadSecuritySettings();
          } catch (error) {
            console.error('Error:', error);
            alert('禁用 MFA 失败: ' + error.message);
          }
        }

        // 关闭 MFA 设置模态框
        function closeMFAModal() {
          document.getElementById('mfa-setup-modal').style.display = 'none';
          document.getElementById('mfa-token-input').value = '';
        }

        // ========== Passkey 功能 ==========

        // Base64URL 解码
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

        // 设置 Passkey
        async function setupPasskey() {
          const token = getSessionToken();
          const deviceName = prompt('请为这个设备命名（例如: My iPhone）：', '');
          if (!deviceName) {
            return;
          }

          try {
            // 1. 获取注册选项
            const optionsResponse = await fetch('/api/security/passkey/register/options', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              }
            });

            if (!optionsResponse.ok) {
              throw new Error('Failed to get registration options');
            }

            const options = await optionsResponse.json();

            // 2. 转换 base64url 字段为 Uint8Array
            options.challenge = base64urlToUint8Array(options.challenge);
            options.user.id = base64urlToUint8Array(options.user.id);
            
            // 转换 excludeCredentials（如果存在）
            if (options.excludeCredentials) {
              options.excludeCredentials = options.excludeCredentials.map(cred => ({
                ...cred,
                id: base64urlToUint8Array(cred.id)
              }));
            }

            // 3. 调用 WebAuthn API
            const credential = await navigator.credentials.create({
              publicKey: options
            });

            if (!credential) {
              throw new Error('No credential returned');
            }

            // 4. 序列化 credential 对象
            const credentialJSON = {
              id: credential.id,
              rawId: uint8ArrayToBase64url(new Uint8Array(credential.rawId)),
              response: {
                clientDataJSON: uint8ArrayToBase64url(new Uint8Array(credential.response.clientDataJSON)),
                attestationObject: uint8ArrayToBase64url(new Uint8Array(credential.response.attestationObject))
              },
              type: credential.type
            };

            // 5. 验证注册
            const verifyResponse = await fetch('/api/security/passkey/register/verify', {
              method: 'POST',
              headers: {
                'Authorization': \`Bearer \${token}\`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                response: credentialJSON,
                device_name: deviceName
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Failed to verify registration');
            }

            alert('Passkey 注册成功！');
            loadSecuritySettings();
          } catch (error) {
            console.error('Error:', error);
            if (error.name === 'NotAllowedError') {
              alert('Passkey 注册被取消');
            } else {
              alert('Passkey 注册失败: ' + error.message);
            }
          }
        }

        // 加载 Passkeys 列表
        async function loadPasskeys() {
          const token = getSessionToken();
          try {
            const response = await fetch('/api/security/passkeys', {
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              return;
            }

            const data = await response.json();
            const container = document.getElementById('passkeys-list');
            
            if (!data.passkeys || data.passkeys.length === 0) {
              container.innerHTML = '<li style="color: #64748b;">暂无 Passkey</li>';
              return;
            }

            container.innerHTML = data.passkeys.map(pk => \`
              <li class="binding-item">
                <div class="binding-info">
                  <div class="binding-platform">\${pk.device_name || '未命名设备'}</div>
                  <div class="binding-date">创建于 \${new Date(pk.created_at).toLocaleString()}</div>
                  \${pk.last_used_at ? \`<div class="binding-date">最后使用 \${new Date(pk.last_used_at).toLocaleString()}</div>\` : ''}
                </div>
                <button class="btn btn-sm btn-danger" onclick="deletePasskeyItem('\${pk.id}')">删除</button>
              </li>
            \`).join('');
          } catch (error) {
            console.error('Error loading passkeys:', error);
          }
        }

        // 删除 Passkey
        async function deletePasskeyItem(passkeyId) {
          if (!confirm('确定要删除此 Passkey 吗？')) {
            return;
          }

          const token = getSessionToken();
          try {
            const response = await fetch(\`/api/security/passkeys/\${passkeyId}\`, {
              method: 'DELETE',
              headers: {
                'Authorization': \`Bearer \${token}\`
              }
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to delete passkey');
            }

            alert('Passkey 已删除！');
            // 重新加载安全设置（会自动更新 Passkey 列表）
            loadSecuritySettings();
            // 同时重新加载 Passkey 列表（如果 modal 还打开）
            loadPasskeys();
          } catch (error) {
            console.error('Error:', error);
            alert('删除 Passkey 失败: ' + error.message);
          }
        }

        // 管理 Passkeys
        function managePasskeys() {
          document.getElementById('passkey-manage-modal').style.display = 'flex';
          loadPasskeys();
        }

        // 关闭 Passkey 管理模态框
        function closePasskeyModal() {
          document.getElementById('passkey-manage-modal').style.display = 'none';
        }

        // 页面加载时执行
        window.addEventListener('DOMContentLoaded', loadAccountSettings);
      `}
    >
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1 style="margin: 0; font-size: 24px; color: #667eea;">⚙️ 账户设置</h1>
          </div>
          <div class="header-actions">
            <button class="btn" onclick="window.location.href='/dashboard'">← 返回 Dashboard</button>
          </div>
        </div>
        
        <div class="content">
          <div class="settings-container">
            {/* 账户信息 */}
            <div class="settings-section">
              <h2>👤 账户信息</h2>
              <div class="account-info">
                <div class="info-item">
                  <span class="info-label">用户名：</span>
                  <span id="account-username">加载中...</span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱：</span>
                  <span id="account-email">加载中...</span>
                  <span id="email-verified-badge"></span>
                </div>
                <div class="info-item">
                  <span class="info-label">注册时间：</span>
                  <span id="account-created">加载中...</span>
                </div>
              </div>
              <button class="btn btn-primary" id="email-action-btn" onclick="openEmailModal()" style="margin-top: 10px;">
                设置邮箱
              </button>
            </div>

            {/* 密码管理 */}
            <div class="settings-section">
              <h2>🔒 密码</h2>
              <p>使用密码登录您的账户</p>
              <div class="settings-status">
                <span>状态：</span>
                <span id="password-status">加载中...</span>
              </div>
              <button class="btn btn-primary" id="password-action" onclick="openPasswordModal()">
                修改密码
              </button>
            </div>

            {/* OAuth 绑定 */}
            <div class="settings-section">
              <h2>🔗 第三方账号绑定</h2>
              <p>绑定第三方账号后，可以使用这些账号快速登录</p>
              
              <h3 style="margin-top: 20px; margin-bottom: 10px;">已绑定的账号</h3>
              <ul id="oauth-bindings-list" class="bindings-list">
                <li>加载中...</li>
              </ul>
              
              <h3 style="margin-top: 25px; margin-bottom: 10px;">绑定新账号</h3>
              <div style="display: flex; gap: 10px;">
                <button id="bind-github-btn" class="btn" onclick="bindOAuth('github')">
                  绑定 GitHub
                </button>
                <button id="bind-gitlab-btn" class="btn" onclick="bindOAuth('gitlab')">
                  绑定 GitLab
                </button>
              </div>
            </div>

            {/* MFA */}
            <div class="settings-section">
              <h2>🔐 双因素认证 (MFA)</h2>
              <p>使用手机应用（如 Google Authenticator、Authy）生成一次性验证码</p>
              <div class="settings-status">
                <span>状态：</span>
                <span id="mfa-status">加载中...</span>
              </div>
              <button id="setup-mfa-btn" class="btn btn-primary" onclick="setupMFA()">
                启用 MFA
              </button>
              <button id="disable-mfa-btn" class="btn btn-danger" onclick="disableMFA()" style="display: none;">
                禁用 MFA
              </button>
            </div>

            {/* Passkey */}
            <div class="settings-section">
              <h2>🔑 Passkey (生物识别登录)</h2>
              <p>使用设备内置的生物识别（指纹、面容 ID）或 PIN 码登录</p>
              <div class="settings-status">
                <span>状态：</span>
                <span id="passkey-status">加载中...</span>
              </div>
              <button id="setup-passkey-btn" class="btn btn-primary" onclick="setupPasskey()">
                注册 Passkey
              </button>
              <button id="manage-passkeys-btn" class="btn" onclick="managePasskeys()" style="display: none;">
                管理 Passkey
              </button>
            </div>

            {/* 说明 */}
            <div class="settings-section">
              <h2>ℹ️ 说明</h2>
              <ul class="settings-info">
                <li>建议至少保留两种登录方式，以防止账号无法访问</li>
                <li>启用 MFA 或 Passkey 后，查看 proxy secrets 需要先验证身份</li>
                <li>解绑最后一种登录方式前，需要先设置其他登录方式</li>
                <li>密码要求：至少8位，包含大小写字母和数字</li>
                <li>Passkey 是最安全的登录方式，支持指纹、面容识别等</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 修改密码模态框 */}
      <div id="password-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3 style="color: #667eea; margin-bottom: 20px;">修改密码</h3>
          <div class="form-group">
            <label for="current-password">当前密码（如果已设置）</label>
            <input type="password" id="current-password" placeholder="输入当前密码" autocomplete="current-password" />
          </div>
          <div class="form-group">
            <label for="new-password">新密码</label>
            <input type="password" id="new-password" placeholder="至少8位，包含大小写字母和数字" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label for="confirm-password">确认新密码</label>
            <input type="password" id="confirm-password" placeholder="再次输入新密码" autocomplete="new-password" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="changePassword()">确认修改</button>
            <button class="btn" onclick="closePasswordModal()">取消</button>
          </div>
        </div>
      </div>

      {/* 邮箱设置模态框 */}
      <div id="email-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3 style="color: #667eea; margin-bottom: 20px;">设置邮箱</h3>
          <div class="form-group">
            <label for="email-input">邮箱地址</label>
            <input type="email" id="email-input" placeholder="输入您的邮箱地址" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="sendVerificationCode()">发送验证码</button>
            <button class="btn" onclick="closeEmailModal()">取消</button>
          </div>
          
          <div id="email-verification-section" style="display:none; margin-top: 20px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
            <p style="color: #10b981; margin-bottom: 15px;">✅ 验证码已发送到您的邮箱！</p>
            <p id="debug-code-display" style="display:none; color: #dc2626; font-weight: bold; margin-bottom: 15px;"></p>
            <div class="form-group">
              <label for="verification-code-input">验证码</label>
              <input type="text" id="verification-code-input" placeholder="输入 6 位验证码" maxlength={6} />
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" onclick="verifyEmail()">验证邮箱</button>
              <button class="btn" onclick="sendVerificationCode()">重新发送</button>
            </div>
          </div>
        </div>
      </div>

      {/* MFA 设置模态框 */}
      <div id="mfa-setup-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3 style="color: #667eea; margin-bottom: 20px;">设置 MFA</h3>
          <p><strong>步骤 1:</strong> 在您的认证应用中扫描以下二维码</p>
          <div class="qr-code-container">
            <div id="mfa-qr-code" style="display: flex; justify-content: center; margin: 20px 0;"></div>
            <div style="text-align: center; margin-top: 15px;">
              <p style="margin: 5px 0; color: #64748b; font-size: 14px;">或者手动输入密钥：</p>
              <p style="margin: 5px 0;"><code id="mfa-secret" style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 14px; word-break: break-all; display: inline-block; max-width: 100%;"></code></p>
            </div>
          </div>
          <p><strong>步骤 2:</strong> 输入认证应用生成的 6 位验证码</p>
          <input
            type="text"
            id="mfa-token-input"
            placeholder="000000"
            maxlength={6}
            style="width:150px;text-align:center;font-size:20px;margin:10px 0;padding:10px;"
          />
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="verifyMFA()">验证并启用</button>
            <button class="btn" onclick="closeMFAModal()">取消</button>
          </div>
        </div>
      </div>

      {/* Passkey 管理模态框 */}
      <div id="passkey-manage-modal" class="modal" style="display:none;">
        <div class="modal-content">
          <h3 style="color: #667eea; margin-bottom: 20px;">管理 Passkey</h3>
          <ul id="passkeys-list" class="bindings-list">
            <li>加载中...</li>
          </ul>
          <div class="modal-actions">
            <button class="btn" onclick="closePasskeyModal()">关闭</button>
          </div>
        </div>
      </div>

      <style>{`
        .header {
          background: white;
          border-radius: 15px;
          padding: 25px 30px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
        }
        
        .content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .settings-container {
          max-width: 100%;
        }

        .settings-section {
          background: white;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 20px;
          border: 2px solid #e2e8f0;
        }

        .settings-section h2 {
          color: #667eea;
          font-size: 1.4em;
          margin-bottom: 15px;
        }

        .settings-section h3 {
          color: #1e293b;
          font-size: 1.1em;
          margin-bottom: 10px;
        }

        .settings-section p {
          color: #64748b;
          margin-bottom: 15px;
          font-size: 0.95em;
        }

        .settings-status {
          margin-bottom: 15px;
          font-size: 1.1em;
          font-weight: 600;
        }

        .settings-status span:first-child {
          color: #1e293b;
        }

        .settings-status span:last-child {
          color: #667eea;
        }

        .account-info {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }

        .info-item {
          display: flex;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-label {
          font-weight: 600;
          color: #64748b;
          min-width: 100px;
        }

        .bindings-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .binding-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .binding-info {
          flex: 1;
        }

        .binding-platform {
          font-weight: 600;
          color: #1e293b;
          font-size: 1.1em;
          margin-bottom: 5px;
        }

        .binding-username {
          color: #667eea;
          font-size: 0.95em;
          margin-bottom: 3px;
        }

        .binding-date {
          color: #94a3b8;
          font-size: 0.85em;
        }

        .settings-info {
          list-style: disc;
          margin-left: 20px;
          color: #64748b;
          font-size: 0.9em;
        }

        .settings-info li {
          margin-bottom: 8px;
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
        
        .modal-content {
          background: white;
          border-radius: 15px;
          padding: 30px;
          max-width: 600px;
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
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .modal-actions {
          margin-top: 25px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .qr-code-container {
          margin: 15px 0;
          padding: 20px;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
        }
        
        #mfa-qr-code {
          background: white;
          padding: 20px;
          border-radius: 8px;
        }
        
        #mfa-qr-code img {
          display: block;
          margin: 0 auto;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
      </DashboardLayout>
  );
};
