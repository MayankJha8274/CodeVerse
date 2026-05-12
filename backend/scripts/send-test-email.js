/*
  Smoke: Direct email send (no queue/cron)

  Usage (PowerShell):
    $env:NODE_ENV='development'
    $env:EMAIL_USER='your@gmail.com'
    $env:EMAIL_PASSWORD='app-password'
    node scripts/send-test-email.js --to you@example.com

  Or SendGrid:
    $env:SENDGRID_API_KEY='...'
    $env:EMAIL_FROM='CodeVerse <noreply@yourdomain.com>'
    node scripts/send-test-email.js --to you@example.com
*/

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sendEmail } = require('../src/services/emailService');

function detectProvider() {
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) return 'smtp';
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) return `smtp-service:${process.env.EMAIL_SERVICE || 'gmail'}`;
  return 'ethereal-dev-fallback';
}

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return fallback;
  return val;
}

(async () => {
  const to = getArg('--to', process.env.SMOKE_TO);
  if (!to) {
    console.error('❌ Missing recipient. Provide --to <email> or set SMOKE_TO');
    process.exit(1);
  }

  const subject = getArg('--subject', 'CodeVerse test email');
  const html = `<p>Test email from CodeVerse backend at ${new Date().toISOString()}</p>`;

  try {
    console.log('📧 Provider mode:', detectProvider());
    const res = await sendEmail({ to, subject, html });
    // Nodemailer returns { messageId, ... }; SendGrid returns array response.
    console.log('✅ sendEmail() succeeded');
    if (res && typeof res === 'object' && 'messageId' in res) {
      console.log('messageId:', res.messageId);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ sendEmail() failed:', err?.message || err);
    process.exit(2);
  }
})();
