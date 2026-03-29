const cron = require('node-cron');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestReminder = require('../models/ContestReminder');
const { fetchAllPlatformStats, calculateAggregatedStats } = require('./aggregationService');
const { generateInsightsSummary } = require('./insightsService');
const { fetchAllContests } = require('./contestService');
const { emailQueue } = require('../queues/emailQueue');
const { createInAppNotification } = require('./notificationService');
const { generateContestReminderTemplate } = require('./emailService');

/**
 * Cron Job Service
 * Handles scheduled tasks like auto-syncing user stats and sending notifications.
 */

// ... (keep existing syncUserStats, syncAllUsers, etc.)

/**
 * Processes contest reminders by finding upcoming contests and notifying eligible users.
 */
async function processContestReminders() {
  console.log('⏰ Checking for upcoming contests to send reminders...');

  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const sixtyOneMinutesFromNow = new Date(now.getTime() + 61 * 60 * 1000);

    // Find contests starting in the next 60-61 minutes to ensure we only run once.
    const upcomingContests = await Contest.find({
      startTime: {
        $gte: oneHourFromNow,
        $lt: sixtyOneMinutesFromNow,
      },
    });

    if (upcomingContests.length === 0) {
      console.log('ℹ️ No contests starting in the next hour.');
      return;
    }

    console.log(`🔥 Found ${upcomingContests.length} upcoming contests. Preparing notifications...`);

    // --- Smart Targeting Logic ---
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users who are active, have participated in contests, and haven't been notified today.
    const eligibleUsers = await User.find({
      'settings.emailNotifications': true,
      'settings.notifyContests': true,
      lastActivityAt: { $gte: twoDaysAgo },
      contestCount: { $gt: 0 },
      $or: [
        { lastNotifiedAt: { $lt: today } },
        { lastNotifiedAt: null }
      ],
    }).limit(100); // Limit to 100 users per day.

    if (eligibleUsers.length === 0) {
      console.log('ℹ️ No eligible users to notify at this time.');
      return;
    }

    console.log(`🎯 Found ${eligibleUsers.length} users to notify.`);

    // --- Loop and Dispatch ---
    for (const contest of upcomingContests) {
      for (const user of eligibleUsers) {
        // 1. Create In-App Notification
        await createInAppNotification(user, contest);

        // 2. Add Email to Queue
        const emailHtml = generateContestReminderTemplate(user, contest);
        await emailQueue.add('contest-reminder', {
          to: user.email,
          subject: `🔥 Contest Starting Soon: ${contest.name}`,
          html: emailHtml,
        });

        // 3. Update User's Last Notified Timestamp
        user.lastNotifiedAt = new Date();
        await user.save();
      }
    }

    console.log(`✅ Successfully queued ${eligibleUsers.length * upcomingContests.length} notifications.`);

  } catch (error) {
    console.error('❌ Error processing contest reminders:', error);
  }
}


/**
 * Placeholder for syncing all users
 */
const syncAllUsers = async () => {
  console.log('🔄 Placeholder: Syncing all users (Feature currently disabled/refactoring)');
};

/**
 * Placeholder for generating weekly reports
 */
const generateAllWeeklyReports = async () => {
  console.log('🔄 Placeholder: Generating weekly reports (Feature currently disabled/refactoring)');
};

/**
 * Start all cron jobs (daily sync + weekly reports + contest reminders)
 */
const startAllCronJobs = () => {
  // Platform sync every 15 minutes
  cron.schedule('*/15 * * * *', syncAllUsers, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Weekly reports on Sunday at 4 AM UTC
  cron.schedule('0 4 * * 0', generateAllWeeklyReports, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Fetch contests every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Fetching contests from all platforms...');
    await fetchAllContests();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Check and push contest reminders to queue every minute
  cron.schedule('* * * * *', processContestReminders, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ All cron jobs started:');
  console.log('   - Platform sync: Every 15 minutes');
  console.log('   - Weekly reports: Sundays at 4:00 AM UTC');
  console.log('   - Contest fetch: Every 6 hours');
  console.log('   - Smart Reminders: Every minute');

  // Initial runs on startup
  setTimeout(() => {
    console.log('🚀 Running initial sync after startup...');
    syncAllUsers().catch(err => console.error('Initial sync failed:', err.message));
    fetchAllContests().catch(err => console.error('Initial contest fetch failed:', err.message));
  }, 30000); // 30-second delay
};

// ... (keep existing stopCronJobs, manualSyncAll, etc.)

module.exports = {
  startAllCronJobs,
  processContestReminders,
};
