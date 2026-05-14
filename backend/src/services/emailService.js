const nodemailer = require('nodemailer');

let sendgridClient = null;

let cachedMailer = null;
let cachedMailerKey = null;
let cachedMailerIsEthereal = false;

function getSendgridClient() {
  if (!process.env.SENDGRID_API_KEY) return null;
  if (sendgridClient) return sendgridClient;

  try {
    // Lazy require so environments without SendGrid don't crash
    const sg = require('@sendgrid/mail');
    sg.setApiKey(process.env.SENDGRID_API_KEY);
    sendgridClient = sg;
    return sendgridClient;
  } catch (err) {
    console.warn('⚠️ SendGrid SDK not installed; falling back to SMTP if configured');
    return null;
  }
}

function buildMailerCacheKey() {
  const env = process.env;
  const parts = [
    env.EMAIL_HOST || '',
    env.EMAIL_PORT || '',
    env.EMAIL_SERVICE || '',
    env.EMAIL_USER || '',
    // Don't include passwords in memory keys. We only want to detect config changes,
    // not store secrets. Length is sufficient for change detection.
    String((env.EMAIL_PASSWORD || '').length),
    env.NODE_ENV || '',
    env.EMAIL_POOL_ENABLED || '',
    env.EMAIL_POOL_MAX_CONNECTIONS || '',
    env.EMAIL_POOL_MAX_MESSAGES || ''
  ];
  return parts.join('|');
}

function getPoolConfig() {
  const enabled = (process.env.EMAIL_POOL_ENABLED || 'true') !== 'false';
  if (!enabled) return {};

  const maxConnections = parseInt(process.env.EMAIL_POOL_MAX_CONNECTIONS || '2', 10);
  const maxMessages = parseInt(process.env.EMAIL_POOL_MAX_MESSAGES || '50', 10);
  return {
    pool: true,
    maxConnections: Number.isFinite(maxConnections) ? maxConnections : 2,
    maxMessages: Number.isFinite(maxMessages) ? maxMessages : 50,
  };
}

async function createNodemailerTransporter() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return {
      transporter: nodemailer.createTransport({
        ...getPoolConfig(),
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }),
      isEthereal: false,
    };
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return {
      transporter: nodemailer.createTransport({
        ...getPoolConfig(),
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }),
      isEthereal: false,
    };
  }

  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    throw new Error('Email configuration missing (set SENDGRID_API_KEY or SMTP credentials)');
  }

  console.log('⚠️ No email credentials found in .env, generating test Ethereal account (dev only)...');
  const testAccount = await nodemailer.createTestAccount();
  return {
    transporter: nodemailer.createTransport({
      ...getPoolConfig(),
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    }),
    isEthereal: true,
  };
}

async function getCachedNodemailerTransporter() {
  const key = buildMailerCacheKey();
  if (cachedMailer && cachedMailerKey === key) {
    return { transporter: cachedMailer, isEthereal: cachedMailerIsEthereal };
  }

  const created = await createNodemailerTransporter();
  cachedMailer = created.transporter;
  cachedMailerKey = key;
  cachedMailerIsEthereal = created.isEthereal;
  return created;
}

const createTransporter = async () => {
  // If SendGrid API key present and SDK loaded, prefer SendGrid (uses HTTP API, avoids SMTP login rate limits)
  if (process.env.SENDGRID_API_KEY && getSendgridClient()) {
    return { type: 'sendgrid' };
  }

  const created = await createNodemailerTransporter();
  return created.transporter;
};

/**
 * Generates a branded HTML email template for contest reminders.
 * @param {object} user - The user object.
 * @param {object} contest - The contest object.
 * @returns {string} The HTML content of the email.
 */
function generateContestReminderTemplate(user, contest) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #EAEAEA; background-color: #121212; max-width: 600px; margin: 20px auto; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1F1F1F; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <h1 style="color: #4A90E2; font-size: 28px; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
          <span style="font-size: 32px;">⚡</span> CodeVerse
        </h1>
      </div>
      <div style="padding: 25px;">
        <h2 style="color: #FFFFFF; font-size: 24px; margin-top: 0;">🔥 Contest Reminder: ${contest.name}</h2>
        <p style="font-size: 16px;">Hey ${user.username || user.fullName || 'there'},</p>
        <p style="font-size: 16px;">Get ready to code! The contest, <strong>${contest.name}</strong>, is scheduled to start in approximately one hour.</p>
        <p style="font-size: 16px;">
          <strong>Platform:</strong> ${(contest.platform || '').charAt(0).toUpperCase() + (contest.platform || '').slice(1)}
        </p>
        <p style="font-size: 16px;">
          <strong>Starts at:</strong> ${new Date(contest.startTime).toUTCString()}
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${contest.url}" style="background-color: #4A90E2; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            Go to Contest 🚀
          </a>
        </div>
        <p style="font-size: 16px;">Good luck, and may the best algorithm win!</p>
        <p style="font-size: 16px;"><em>— The CodeVerse Team</em></p>
      </div>
      <div style="background-color: #1F1F1F; color: #888; padding: 15px; text-align: center; font-size: 12px; border-top: 1px solid #333;">
        <p>You're receiving this because you opted in for contest reminders on CodeVerse.</p>
        <p>&copy; ${new Date().getFullYear()} CodeVerse. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Send an email. This is a more generic email sending function.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 */
async function sendEmail(options) {
  try {
    // Prefer SendGrid HTTP API if configured
    const sg = getSendgridClient();
    if (process.env.SENDGRID_API_KEY && sg) {
      const senderEmail = process.env.EMAIL_FROM || `CodeVerse <${process.env.EMAIL_USER || 'noreply@example.com'}>`;
      const msg = {
        to: options.to,
        from: senderEmail,
        subject: options.subject,
        html: options.html,
        text: options.html.replace(/<[^>]*>?/gm, ''),
      };

      // Safe bulk testing: SendGrid sandbox mode accepts the request but does not deliver.
      if ((process.env.SENDGRID_SANDBOX_MODE || 'false') === 'true') {
        msg.mailSettings = { sandboxMode: { enable: true } };
      }
      const res = await sg.send(msg);
      return res;
    }

    const { transporter, isEthereal } = await getCachedNodemailerTransporter();
    const senderEmail = process.env.EMAIL_FROM || `"CodeVerse" <${process.env.EMAIL_USER}>`;

    const mailOptions = {
      from: senderEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      // You can add a text version as a fallback
      text: options.html.replace(/<[^>]*>?/gm, ''),
    };

    let info = await transporter.sendMail(mailOptions);

    // Log URL for Ethereal test emails
    if (process.env.NODE_ENV !== 'production' && isEthereal) {
      console.log(`📧 Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${options.to}:`, error);
    throw error; // Re-throw the error to be caught by the worker
  }
}

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    // SendGrid has no SMTP verify; we only validate that the SDK can initialize.
    if (process.env.SENDGRID_API_KEY) {
      const sg = getSendgridClient();
      const ok = !!sg;
      if (ok) console.log('✅ SendGrid configuration detected');
      return ok;
    }

    const transporter = await createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  generateContestReminderTemplate,
  verifyEmailConfig
};
