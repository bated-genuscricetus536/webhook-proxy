import { html } from 'hono/html';
import { Layout } from '../components/Layout';

/**
 * 密码重置页面
 */
export const ResetPassword = () => {
  return Layout({
    title: '重置密码 - Webhook Proxy',
    children: html`
      <style>
        .reset-container {
          max-width: 450px;
          margin: 60px auto;
          padding: 40px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .reset-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .reset-header h1 {
          font-size: 28px;
          color: #1e293b;
          margin-bottom: 10px;
        }
        
        .reset-header p {
          color: #64748b;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-weight: 500;
          font-size: 14px;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.3s;
          box-sizing: border-box;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .btn:hover {
          transform: translateY(-2px);
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .back-link {
          text-align: center;
          margin-top: 20px;
        }
        
        .back-link a {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }
        
        .back-link a:hover {
          text-decoration: underline;
        }
        
        .info-box {
          background: #f0f9ff;
          border-left: 4px solid #3b82f6;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 14px;
          color: #1e40af;
        }
        
        .error-box {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 14px;
          color: #991b1b;
          display: none;
        }
        
        .success-box {
          background: #f0fdf4;
          border-left: 4px solid #22c55e;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 14px;
          color: #166534;
          display: none;
        }
        
        #reset-form {
          display: block;
        }
        
        #verify-form {
          display: none;
        }
      </style>
      
      <div class="reset-container">
        <div class="reset-header">
          <h1>🔐 重置密码</h1>
          <p>通过邮箱验证来重置您的密码</p>
        </div>
        
        <div id="error-box" class="error-box"></div>
        <div id="success-box" class="success-box"></div>
        
        <!-- 第一步：请求重置 -->
        <div id="reset-form">
          <div class="info-box">
            💡 我们会向您的邮箱发送验证码，请确保邮箱地址正确。
          </div>
          
          <form onsubmit="requestReset(event)">
            <div class="form-group">
              <label for="email">邮箱地址</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="your@email.com" 
                required 
                autocomplete="email"
              />
            </div>
            
            <button type="submit" class="btn" id="request-btn">发送验证码</button>
          </form>
        </div>
        
        <!-- 第二步：验证并重置密码 -->
        <div id="verify-form">
          <div class="info-box">
            ✅ 验证码已发送！请查收邮件（包括垃圾邮件箱）。
          </div>
          
          <form onsubmit="resetPassword(event)">
            <div class="form-group">
              <label for="code">验证码</label>
              <input 
                type="text" 
                id="code" 
                name="code" 
                placeholder="输入 6 位验证码" 
                maxlength="6" 
                required 
                autocomplete="off"
              />
            </div>
            
            <div class="form-group">
              <label for="new-password">新密码</label>
              <input 
                type="password" 
                id="new-password" 
                name="new-password" 
                placeholder="至少 8 个字符" 
                required 
                autocomplete="new-password"
              />
            </div>
            
            <div class="form-group">
              <label for="confirm-password">确认新密码</label>
              <input 
                type="password" 
                id="confirm-password" 
                name="confirm-password" 
                placeholder="再次输入新密码" 
                required 
                autocomplete="new-password"
              />
            </div>
            
            <button type="submit" class="btn" id="reset-btn">重置密码</button>
          </form>
          
          <div class="back-link" style="margin-top: 15px;">
            <a href="javascript:void(0)" onclick="backToRequest()">← 返回重新发送</a>
          </div>
        </div>
        
        <div class="back-link">
          <a href="/">← 返回登录</a>
        </div>
      </div>
      
      <script>
        let userEmail = '';
        
        function showError(message) {
          const errorBox = document.getElementById('error-box');
          errorBox.textContent = message;
          errorBox.style.display = 'block';
          setTimeout(() => {
            errorBox.style.display = 'none';
          }, 5000);
        }
        
        function showSuccess(message) {
          const successBox = document.getElementById('success-box');
          successBox.textContent = message;
          successBox.style.display = 'block';
        }
        
        async function requestReset(event) {
          event.preventDefault();
          
          const email = document.getElementById('email').value;
          const btn = document.getElementById('request-btn');
          
          btn.disabled = true;
          btn.textContent = '发送中...';
          
          try {
            const response = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || '发送失败');
            }
            
            userEmail = email;
            
            // 切换到验证表单
            document.getElementById('reset-form').style.display = 'none';
            document.getElementById('verify-form').style.display = 'block';
            
            showSuccess(data.message || '验证码已发送到您的邮箱！');
          } catch (error) {
            showError(error.message);
            btn.disabled = false;
            btn.textContent = '发送验证码';
          }
        }
        
        async function resetPassword(event) {
          event.preventDefault();
          
          const code = document.getElementById('code').value;
          const newPassword = document.getElementById('new-password').value;
          const confirmPassword = document.getElementById('confirm-password').value;
          
          if (newPassword !== confirmPassword) {
            showError('两次输入的密码不一致');
            return;
          }
          
          if (newPassword.length < 8) {
            showError('密码至少需要 8 个字符');
            return;
          }
          
          const btn = document.getElementById('reset-btn');
          btn.disabled = true;
          btn.textContent = '重置中...';
          
          try {
            const response = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: userEmail,
                code,
                new_password: newPassword
              })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || '重置失败');
            }
            
            showSuccess('✅ 密码重置成功！正在跳转到登录页面...');
            
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } catch (error) {
            showError(error.message);
            btn.disabled = false;
            btn.textContent = '重置密码';
          }
        }
        
        function backToRequest() {
          document.getElementById('verify-form').style.display = 'none';
          document.getElementById('reset-form').style.display = 'block';
          document.getElementById('code').value = '';
          document.getElementById('new-password').value = '';
          document.getElementById('confirm-password').value = '';
          document.getElementById('success-box').style.display = 'none';
        }
      </script>
    `,
  });
};

