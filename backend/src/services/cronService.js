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

    // Find unsent reminders where the scheduled reminderTime has passed
    const pendingReminders = await ContestReminder.find({
      reminderSent: false,
      reminderTime: { $lte: now }
    }).populate('userId contestId');

    if (pendingReminders.length === 0) {
      console.log('ℹ️ No reminders to process right now.');
      return;
    }

    console.log(`🔥 Found ${pendingReminders.length} pending reminders. Preparing notifications...`);

    // --- Loop and Dispatch ---
    for (const reminder of pendingReminders) {
      const user = reminder.userId;
      const contest = reminder.contestId;

      if (!user || !contest) {
        // If underlying user or contest was deleted, mark as sent to avoid infinite retries
        reminder.reminderSent = true;
        await reminder.save();
        continue;
      }

      // 1. Create In-App Notification
      if (typeof createInAppNotification === 'function') {
        await createInAppNotification(user, contest).catch(err => console.error(err));
      }

      // 2. Add Email to Queue
      if (typeof generateContestReminderTemplate === 'function') {
        const emailHtml = generateContestReminderTemplate(user, contest);
        await emailQueue.add('contest-reminder', {
          to: user.email,
          subject: `🔥 Contest Starting Soon: ${contest.name}`,
          html: emailHtml,
        }).catch(err => console.error(err));
      }

      // 3. Update Reminder state
      reminder.reminderSent = true;
      await reminder.save();
    }

    console.log(`✅ Successfully processed ${pendingReminders.length} reminders.`);

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
