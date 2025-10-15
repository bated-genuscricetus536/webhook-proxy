/**
 * 测试邮件发送功能
 * 
 * 使用方法：
 * 在浏览器控制台中运行，或通过 API 直接测试
 */

// 示例：直接调用 MailChannels API 测试
async function testMailChannels() {
  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: 'your-email@example.com' }], // 替换为您的邮箱
        },
      ],
      from: {
        email: 'noreply@hooks.zhin.dev',
        name: 'Webhook Proxy',
      },
      subject: '测试邮件 - Webhook Proxy',
      content: [
        {
          type: 'text/plain',
          value: '这是一封测试邮件。如果您收到此邮件，说明邮件发送功能正常工作！',
        },
        {
          type: 'text/html',
          value: `
            <html>
              <body style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #667eea;">✅ 测试成功！</h1>
                <p>这是一封测试邮件。如果您收到此邮件，说明邮件发送功能正常工作！</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px;">
                  © ${new Date().getFullYear()} Webhook Proxy
                </p>
              </body>
            </html>
          `,
        },
      ],
    }),
  });

  if (response.ok) {
    console.log('✅ 邮件发送成功！');
    console.log('请检查您的邮箱（包括垃圾箱）');
  } else {
    const errorText = await response.text();
    console.error('❌ 邮件发送失败：', response.status, errorText);
  }
}

// 导出供其他脚本使用
export { testMailChannels };

/**
 * 快速测试步骤：
 * 
 * 1. 在浏览器控制台中运行：
 *    ```javascript
 *    fetch('https://api.mailchannels.net/tx/v1/send', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      body: JSON.stringify({
 *        personalizations: [{ to: [{ email: 'your-email@example.com' }] }],
 *        from: { email: 'noreply@hooks.zhin.dev', name: 'Test' },
 *        subject: 'Test',
 *        content: [{ type: 'text/plain', value: 'Test email' }]
 *      })
 *    }).then(r => console.log('Status:', r.status))
 *    ```
 * 
 * 2. 或者在登录后的应用中测试：
 *    - 访问 https://hooks.zhin.dev/settings
 *    - 点击"设置邮箱"
 *    - 输入邮箱并发送验证码
 */

