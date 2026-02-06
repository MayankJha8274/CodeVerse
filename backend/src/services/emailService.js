const nodemailer = require('nodemailer');

// Create transporter - configure with your email service
const createTransporter = () => {
  // For Gmail, you'll need to enable "Less secure app access" or use App Passwords
  // For production, use services like SendGrid, Mailgun, AWS SES, etc.
  
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use app-specific password for Gmail
    }
  });

  return transporter;
};

/**
 * Send contest reminder email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {Object} options.contest - Contest details
 */
const sendContestReminder = async ({ to, contest }) => {
  try {
    const transporter = createTransporter();
    
    const platformColors = {
      leetcode: '#FFA116',
      codeforces: '#1F8ACB',
      codechef: '#5B4638',
      atcoder: '#222222',
      hackerrank: '#00EA64'
    };

    const platformNames = {
      leetcode: 'LeetCode',
      codeforces: 'Codeforces',
      codechef: 'CodeChef',
      atcoder: 'AtCoder',
      hackerrank: 'HackerRank'
    };

    const startTime = new Date(contest.startTime);
    const formattedDate = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const durationHours = Math.floor(contest.duration / 60);
    const durationMins = contest.duration % 60;
    const durationText = durationHours > 0 
      ? `${durationHours}h ${durationMins}m` 
      : `${durationMins} minutes`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contest Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d0d14; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background-color: #16161f; border-radius: 16px; overflow: hidden; max-width: 600px;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${platformColors[contest.platform] || '#f59e0b'}20, transparent); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px;">⏰ Contest Reminder</h1>
                  <p style="color: #9ca3af; margin: 0; font-size: 14px;">Don't miss your upcoming contest!</p>
                </td>
              </tr>
              
              <!-- Contest Details -->
              <tr>
                <td style="padding: 30px;">
                  <!-- Platform Badge -->
                  <div style="margin-bottom: 20px;">
                    <span style="background-color: ${platformColors[contest.platform] || '#f59e0b'}30; color: ${platformColors[contest.platform] || '#f59e0b'}; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${platformNames[contest.platform] || contest.platform}
                    </span>
                  </div>
                  
                  <!-- Contest Name -->
                  <h2 style="color: #ffffff; margin: 0 0 20px 0; font-size: 22px; line-height: 1.4;">
                    ${contest.name}
                  </h2>
                  
                  <!-- Details Cards -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; width: 48%;">
                        <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">📅 Date & Time</p>
                        <p style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600;">${formattedDate}</p>
                        <p style="color: ${platformColors[contest.platform] || '#f59e0b'}; margin: 5px 0 0 0; font-size: 16px; font-weight: 700;">${formattedTime}</p>
                      </td>
                      <td style="width: 4%;"></td>
                      <td style="background-color: #1a1a2e; border-radius: 12px; padding: 20px; width: 48%;">
                        <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">⏱️ Duration</p>
                        <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">${durationText}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Countdown Info -->
                  <div style="background: linear-gradient(135deg, #f59e0b20, #fb923c20); border: 1px solid #f59e0b30; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                    <p style="color: #f59e0b; margin: 0; font-size: 16px; font-weight: 600;">
                      🔔 Contest starts in approximately 16 hours
                    </p>
                    <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 13px;">
                      Make sure you're ready and have registered!
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <a href="${contest.url}" style="display: block; background-color: ${platformColors[contest.platform] || '#f59e0b'}; color: #000000; text-decoration: none; padding: 16px 30px; border-radius: 10px; font-weight: 700; font-size: 16px; text-align: center;">
                    Open Contest Page →
                  </a>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 30px 30px; border-top: 1px solid #2a2a3e;">
                  <p style="color: #6b7280; margin: 0; font-size: 12px; text-align: center;">
                    This reminder was sent from CodeVerse Contest Tracker.<br>
                    You set this reminder to be notified about upcoming contests.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const textContent = `
Contest Reminder - ${platformNames[contest.platform] || contest.platform}

${contest.name}

📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
⏱️ Duration: ${durationText}

Contest starts in approximately 16 hours. Make sure you're ready!

Open contest: ${contest.url}

---
This reminder was sent from CodeVerse Contest Tracker.
    `;

    const mailOptions = {
      from: `"CodeVerse Contest Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject: `⏰ Reminder: ${contest.name} starts in 16 hours!`,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Reminder email sent to ${to} for contest: ${contest.name}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send reminder email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendContestReminder,
  verifyEmailConfig
};
