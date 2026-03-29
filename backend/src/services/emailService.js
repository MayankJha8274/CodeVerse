const nodemailer = require('nodemailer');

// Create transporter - configure with your email service
const createTransporter = async () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Standard SMTP connection for ESPs (Resend, SendGrid, Mailgun)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Fallback to basic service (e.g. gmail App passwords)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Generate a testing account if no real credentials are set
    console.log('⚠️ No EMAIL_USER found in .env, generating test Ethereal account...');
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

/**
 * Generates a branded HTML email template for contest reminders.
 * @param {object} user - The user object.
 * @param {object} contest - The contest object.
 * @returns {string} The HTML content of the email.
 */
function generateContestReminderTemplate(user, contest) {
  // Replace with your publicly hosted logo URL.
  const logoUrl = 'https://i.imgur.com/gE29H8A.png'; // Placeholder CodeVerse logo

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #EAEAEA; background-color: #121212; max-width: 600px; margin: 20px auto; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1F1F1F; padding: 20px; text-align: center; border-bottom: 1px solid #333;">
        <img src="${logoUrl}" alt="CodeVerse Logo" style="max-width: 150px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      </div>
      <div style="padding: 25px;">
        <h2 style="color: #FFFFFF; font-size: 24px; margin-top: 0;">🔥 Contest Reminder: ${contest.name}</h2>
        <p style="font-size: 16px;">Hey ${user.username},</p>
        <p style="font-size: 16px;">Get ready to code! The contest, <strong>${contest.name}</strong>, is scheduled to start in approximately one hour.</p>
        <p style="font-size: 16px;">
          <strong>Starts at:</strong> ${new Date(contest.startTime).toLocaleString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
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
    const transporter = await createTransporter();
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
    if (process.env.NODE_ENV !== 'production' && !process.env.EMAIL_HOST) {
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
