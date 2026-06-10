const cron = require('node-cron');
const https = require('https');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ContestReminder = require('../models/ContestReminder');
const { fetchAllPlatformStats, calculateAggregatedStats } = require('./aggregationService');
const { generateInsightsSummary } = require('./insightsService');
const { fetchAllContests } = require('./contestService');
const { emailQueue } = require('../queues/emailQueue');
const { createInAppNotification } = require('./notificationService');
const { generateContestReminderTemplate } = require('./emailService');

function startKeepAlive() {
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
  if (!selfUrl) {
    console.log('ℹ️ Keep-alive: no RENDER_EXTERNAL_URL or SELF_URL set, skipping');
    return;
  }
  const pingUrl = `${selfUrl.replace(/\/+$/, '')}/health`;
  cron.schedule('*/10 * * * *', () => {
    https.get(pingUrl, (res) => {
      res.resume();
    }).on('error', () => {});
  }, { scheduled: true, timezone: 'UTC' });
  console.log(`⏰ Keep-alive ping every 10 min → ${pingUrl}`);
}

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

    // Claim reminders atomically to avoid duplicate processing in multi-instance deployments.
    // This loop processes reminders one-by-one (fast enough at 1-minute cadence).
    let processedCount = 0;
    const lockMs = 5 * 60 * 1000; // 5 minutes lock

    while (true) {
      const lockUntil = new Date(Date.now() + lockMs);
      const reminder = await ContestReminder.findOneAndUpdate(
        {
          reminderSent: false,
          reminderTime: { $lte: now },
          $and: [
            { $or: [{ status: 'pending' }, { status: { $exists: false } }, { status: null }] },
            { $or: [{ lockedUntil: null }, { lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }] }
          ]
        },
        { $set: { status: 'processing', lockedUntil: lockUntil, lastError: null } },
        { sort: { reminderTime: 1 }, returnDocument: 'after' }
      ).populate('userId contestId');

      if (!reminder) break;
      processedCount += 1;

      try {
        const user = reminder.userId;
        const contest = reminder.contestId;

        if (!user || !contest) {
          // If underlying user or contest was deleted, mark done to avoid infinite retries
          reminder.reminderSent = true;
          reminder.status = 'done';
          reminder.lockedUntil = null;
          await reminder.save();
          continue;
        }

        // 1. Create In-App Notification
        if (typeof createInAppNotification === 'function') {
          await createInAppNotification(user, contest).catch(err => console.error(err));
        }

        // 2. Add Email to Queue
        let emailQueued = false;
        let emailDurable = false;
        if (typeof generateContestReminderTemplate === 'function') {
          const emailHtml = generateContestReminderTemplate(user, contest);
          try {
            const result = await emailQueue.add('contest-reminder', {
              reminderId: reminder._id,
              to: reminder.email || user.email,
              subject: `🔥 Contest Starting Soon: ${contest.name}`,
              html: emailHtml,
            }, {
              jobId: `contest-reminder:${reminder._id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 }
            });
            emailQueued = true;
            emailDurable = !!(result && result.durable);
          } catch (err) {
            console.error('❌ Failed to enqueue email job for', (reminder.email || user.email), err.message || err);
            reminder.lastError = err?.message || String(err);
          }
        }

        // 3. Update reminder state
        if (emailQueued && emailDurable) {
          // Job is durably persisted (BullMQ or Mongo). Mark as queued with a lease.
          // Don't mark as sent/done until the email worker reports success.
          reminder.reminderSent = false;
          reminder.status = 'queued';
          reminder.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes lease
        } else if (emailQueued && !emailDurable) {
          // Job went to volatile in-memory queue. Keep as pending so cron retries
          // on next run in case the server restarts before delivery.
          reminder.status = 'pending';
          reminder.lockedUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 min cooldown
          console.warn('⚠️ Email job for', (reminder.email || user.email), 'is in volatile memory queue. Will retry on next cron cycle if not delivered.');
        } else {
          // Allow retry on next run; keep a short cooldown to avoid tight loops
          reminder.status = 'pending';
          reminder.lockedUntil = new Date(Date.now() + 60 * 1000);
        }
        await reminder.save();
      } catch (err) {
        console.error('❌ Reminder processing error:', err.message || err);
        try {
          await ContestReminder.updateOne(
            { _id: reminder._id },
            {
              $set: {
                status: 'pending',
                lockedUntil: new Date(Date.now() + 60 * 1000),
                lastError: err?.message || String(err)
              }
            }
          );
        } catch (_) {
          // ignore
        }
      }
    }

    if (processedCount === 0) {
      console.log('ℹ️ No reminders to process right now.');
      return;
    }

    console.log(`✅ Successfully processed ${processedCount} reminders.`);

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

  startKeepAlive();

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
