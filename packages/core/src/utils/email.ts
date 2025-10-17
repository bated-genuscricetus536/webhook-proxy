/**
 * 邮件发送工具（使用 Resend API）
 * 
 * Resend 是一个专为开发者设计的邮件发送服务
 * 免费额度：3000 封/月
 * 官网：https://resend.com
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: {
    email: string;
    name?: string;
  };
}

/**
 * 发送邮件（通过 Resend API）
 */
export async function sendEmail(
  options: EmailOptions,
  resendApiKey: string
): Promise<boolean> {
  const { to, subject, text, html, from } = options;

  // 默认发件人
  const fromEmail = from?.email || 'noreply@zhin.dev';
  const fromName = from?.name || 'Webhook Proxy';

  try {
    console.log('[Email] Sending email via Resend:', {
      from: fromEmail,
      to,
      subject,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Email] Resend error:', response.status, errorText);
      console.error('[Email] Request details:', {
        from: fromEmail,
        to,
      });
      return false;
    }

    const result = await response.json();
    console.log('[Email] Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return false;
  }
}

/**
 * 发送邮箱验证码邮件
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  username: string,
  resendApiKey: string
): Promise<boolean> {
  const subject = '验证您的邮箱 - Webhook Proxy';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 40px 30px;
    }
    .code-box {
      background: #f1f5f9;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .note {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Webhook Proxy</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">邮箱验证</p>
    </div>
    
    <div class="content">
      <p>您好，<strong>${username}</strong>！</p>
      
      <p>感谢您使用 Webhook Proxy。请使用以下验证码完成邮箱验证：</p>
      
      <div class="code-box">
        <div style="color: #64748b; font-size: 14px; margin-bottom: 10px;">您的验证码</div>
        <div class="code">${code}</div>
      </div>
      
      <div class="note">
        <strong>⏰ 注意：</strong> 此验证码将在 <strong>10 分钟</strong>内有效。
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        如果您没有请求此验证码，请忽略此邮件。
      </p>
    </div>
    
    <div class="footer">
      <p>此邮件由 Webhook Proxy 自动发送，请勿直接回复。</p>
      <p>© ${new Date().getFullYear()} Webhook Proxy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
您好，${username}！

感谢您使用 Webhook Proxy。请使用以下验证码完成邮箱验证：

验证码: ${code}

注意：此验证码将在 10 分钟内有效。

如果您没有请求此验证码，请忽略此邮件。

---
此邮件由 Webhook Proxy 自动发送，请勿直接回复。
© ${new Date().getFullYear()} Webhook Proxy. All rights reserved.
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text,
  }, resendApiKey);
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
  username: string,
  resendApiKey: string
): Promise<boolean> {
  const subject = '重置您的密码 - Webhook Proxy';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 40px 30px;
    }
    .code-box {
      background: #f1f5f9;
      border: 2px dashed #667eea;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .security-tip {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
      color: #991b1b;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 密码重置</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Webhook Proxy</p>
    </div>
    
    <div class="content">
      <p>您好，<strong>${username}</strong>！</p>
      
      <p>我们收到了您重置密码的请求。请使用以下验证码完成密码重置：</p>
      
      <div class="code-box">
        <div style="color: #64748b; font-size: 14px; margin-bottom: 10px;">您的验证码</div>
        <div class="code">${code}</div>
      </div>
      
      <div class="warning">
        <strong>⏰ 注意：</strong> 此验证码将在 <strong>10 分钟</strong>内有效。
      </div>
      
      <div class="security-tip">
        <strong>🔒 安全提示：</strong><br/>
        • 请勿将此验证码告诉任何人<br/>
        • 如果您没有请求重置密码，请立即忽略此邮件<br/>
        • 为了账户安全，建议您定期更换密码
      </div>
    </div>
    
    <div class="footer">
      <p>此邮件由 Webhook Proxy 自动发送，请勿直接回复。</p>
      <p>© ${new Date().getFullYear()} Webhook Proxy. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
您好，${username}！

我们收到了您重置密码的请求。请使用以下验证码完成密码重置：

验证码: ${code}

注意：此验证码将在 10 分钟内有效。

安全提示：
- 请勿将此验证码告诉任何人
- 如果您没有请求重置密码，请立即忽略此邮件
- 为了账户安全，建议您定期更换密码

---
此邮件由 Webhook Proxy 自动发送，请勿直接回复。
© ${new Date().getFullYear()} Webhook Proxy. All rights reserved.
  `.trim();

  return sendEmail({
    to,
    subject,
    html,
    text,
  }, resendApiKey);
}

