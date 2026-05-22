const nodemailer = require('nodemailer');
require('dotenv').config();

async function sendWeeklyReport(content, weekStart, weekEnd) {
  if (!process.env.GMAIL_PASSWORD || process.env.GMAIL_PASSWORD === 'your_gmail_app_password_here') {
    console.log('📧 Email not configured — skipping send. Content length:', content.length);
    return { skipped: true };
  }
  const t = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.GMAIL_USER, pass:process.env.GMAIL_PASSWORD }});
  return t.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `💛 Mirla's Weekly Health Summary — ${weekStart}`,
    html: `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;background:#fffbeb;padding:30px;border-radius:16px;border:1px solid #fde68a"><h1 style="color:#92400e;font-weight:300">Mirla's Health Journey</h1><p style="color:#b45309">Week of ${weekStart} — ${weekEnd}</p><div style="background:white;border-radius:12px;padding:24px;border:1px solid #fde68a;white-space:pre-wrap;color:#78350f;line-height:1.7">${content.replace(/\n/g,'<br>')}</div><p style="text-align:center;color:#b45309;font-style:italic;margin-top:24px">No one else sees it. Just you and your journey. 💛</p></div>`
  });
}

module.exports = { sendWeeklyReport };
