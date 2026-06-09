const axios = require('axios');
const config = require('../config');

const RESEND_API = 'https://api.resend.com/emails';

async function sendEmail({ to, subject, html, from = config.RESEND_FROM_EMAIL }) {
  if (!config.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email');
    return null;
  }
  try {
    const res = await axios.post(RESEND_API, {
      from,
      to,
      subject,
      html
    }, {
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (err) {
    console.error('[Email] Resend error:', err.response?.data || err.message);
    throw err;
  }
}

function buildAgentReadyEmail({ agentName, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 48px; }
    .logo { font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .logo span { color: #7c3aed; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 40px; backdrop-filter: blur(20px); }
    .title { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0 0 16px 0; line-height: 1.2; }
    .subtitle { font-size: 16px; color: rgba(255,255,255,0.5); margin: 0 0 32px 0; line-height: 1.6; }
    .agent-name { font-size: 20px; font-weight: 600; color: #7c3aed; margin: 0 0 8px 0; }
    .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 32px 0; }
    .features { margin: 24px 0; }
    .feature { display: flex; align-items: center; gap: 12px; margin: 12px 0; color: rgba(255,255,255,0.7); font-size: 14px; }
    .feature-dot { width: 6px; height: 6px; background: #7c3aed; border-radius: 50%; flex-shrink: 0; }
    .cta { display: inline-block; background: #7c3aed; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; margin-top: 24px; }
    .footer { text-align: center; margin-top: 48px; color: rgba(255,255,255,0.3); font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Agent<span>Core</span></div>
    </div>
    <div class="card">
      <h1 class="title">Ваш AI-сотрудник готов</h1>
      <p class="subtitle">Мы завершили разработку вашего цифрового сотрудника. Он прошёл все тесты и готов к работе.</p>
      <div class="agent-name">${agentName}</div>
      <div class="divider"></div>
      <div class="features">
        <div class="feature"><div class="feature-dot"></div>Обработка клиентских запросов 24/7</div>
        <div class="feature"><div class="feature-dot"></div>Интеграция с мессенджерами и CRM</div>
        <div class="feature"><div class="feature-dot"></div>Персонализированные ответы на основе базы знаний</div>
        <div class="feature"><div class="feature-dot"></div>Аналитика и отчёты по диалогам</div>
      </div>
      <a href="${dashboardUrl}" class="cta">Перейти в кабинет</a>
    </div>
    <div class="footer">
      AgentCore — AI-агентство для бизнеса<br>
      Если у вас есть вопросы, напишите на support@agentcore.work
    </div>
  </div>
</body>
</html>
  `;
}

async function sendAgentReadyEmail({ to, agentName, agentId }) {
  const dashboardUrl = `${config.CLIENT_URL}/agents/${agentId}`;
  const html = buildAgentReadyEmail({ agentName, dashboardUrl });
  return sendEmail({ to, subject: 'Ваш AI-сотрудник готов — AgentCore', html });
}

module.exports = { sendEmail, sendAgentReadyEmail };
