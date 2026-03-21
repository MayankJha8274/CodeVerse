const cron = require('node-cron');
const User = require('../models/User');
const ContestReminder = require('../models/ContestReminder');
const { fetchAllPlatformStats, calculateAggregatedStats } = require('./aggregationService');
const { generateInsightsSummary } = require('./insightsService');
const { fetchAllContests } = require('./contestService');
const { sendContestReminder } = require('./emailService');
const { addSyncJob } = require('../queues/syncQueue'); // Added queue import

/**
 * Cron Job Service
 * Handles scheduled tasks like auto-syncing user stats
 */

let syncJob = null;

/**
 * Sync stats for a single user via Background Queue
 */
const syncUserStats = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return;
    }

    // Check if any platform is connected
    const hasPlatforms = Object.values(user.platforms).some(p => p !== null);
    if (!hasPlatforms) {
      return;
    }

    console.log(`🔄 Queuing auto-sync job for user: ${user.username}`);
    
    // Instead of old blocking call, add to BullMQ queue:
    await addSyncJob(user._id, {
      priority: 5, 
      triggeredBy: 'cron'
    });
    
    console.log(`✅ Queued sync for user: ${user.username}`);
  } catch (error) {
    console.error(`❌ Error queuing sync user ${userId}:`, error.message);
  }
};

/**
 * Sync ONLY outdated users via Batch Jobs (Feature #5) 
 */
const syncAllUsers = async () => {
  try {
    console.log('🚀 Starting scheduled sync lookup for outdated users...');
    
    // Feature 5: Sync ONLY outdated users. (E.g. Not synced in last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const users = await User.find({ 
      isActive: true,
      $or: [
        { lastSyncedAt: { $lt: thirtyMinutesAgo } },
        { lastSyncedAt: null },
        { syncStatus: 'failed' } // Retry failed users
      ]
    });
    console.log(`Found ${users.length} active users needing a sync`);

    for (let i = 0; i < users.length; i++) {
        await syncUserStats(users[i]._id);
    }

    console.log('✅ Completed queue dispatch for outdated users');
  } catch (error) {
    console.error('❌ Error in scheduling syncs:', error.message);
  }
};

/**
 * Start the cron job
 * Default: Runs every 15 minutes to keep data fresh
 */
const startCronJobs = () => {
  // Schedule: Every 15 minutes for near-real-time data
  // Cron format: minute hour day month weekday
  syncJob = cron.schedule('*/15 * * * *', syncAllUsers, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ Cron job started: Platform sync every 15 minutes');
  console.log('⏰ Next sync will occur in ~15 minutes');
  
  // Run first sync after 1 minute to ensure data is fresh on startup
  setTimeout(() => {
    console.log('🚀 Running initial sync after startup...');
    syncAllUsers().catch(err => console.error('Initial sync failed:', err.message));
  }, 60000); // 1 minute delay
};

/**
 * Stop the cron job
 */
const stopCronJobs = () => {
  if (syncJob) {
    syncJob.stop();
    console.log('⏸️  Cron job stopped');
  }
};

/**
 * Manually trigger sync for all users (for testing)
 */
const manualSyncAll = async () => {
  console.log('🔧 Manual sync triggered');
  await syncAllUsers();
};

/**
 * Generate weekly report for a user
 */
const generateWeeklyReport = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    console.log(`📊 Generating weekly report for: ${user.username}`);

    const insights = await generateInsightsSummary(userId);
    
    // Store report or send notification
    // For now, just log it
    console.log(`✅ Weekly report generated for ${user.username}:`, {
      achievements: insights.recentAchievements.length,
      weakAreas: insights.weakAreas.length,
      suggestedGoals: insights.suggestedGoals
    });

    return insights;
  } catch (error) {
    console.error(`❌ Error generating weekly report for ${userId}:`, error.message);
  }
};

/**
 * Generate weekly reports for all users
 */
const generateAllWeeklyReports = async () => {
  try {
    console.log('📈 Starting weekly report generation...');
    
    const users = await User.find({ isActive: true });
    console.log(`Generating reports for ${users.length} users`);

    for (const user of users) {
      await generateWeeklyReport(user._id);
      // Small delay between reports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Completed weekly report generation');
  } catch (error) {
    console.error('❌ Error in weekly report generation:', error.message);
  }
};

/**
 * Start all cron jobs (daily sync + weekly reports + contest reminders)
 */
const startAllCronJobs = () => {
  // Platform sync every 15 minutes for near-real-time data
  const dailySyncJob = cron.schedule('*/15 * * * *', syncAllUsers, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Weekly reports on Sunday at 4 AM UTC
  const weeklyReportJob = cron.schedule('0 4 * * 0', generateAllWeeklyReports, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Fetch contests every 6 hours
  const contestFetchJob = cron.schedule('0 */6 * * *', async () => {
    console.log('🔄 Fetching contests from all platforms...');
    await fetchAllContests();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Check and send contest reminders every 5 minutes
  const reminderJob = cron.schedule('*/5 * * * *', processContestReminders, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ Cron jobs started:');
  console.log('   - Platform sync: Every 15 minutes');
  console.log('   - Weekly reports: Sundays at 4:00 AM UTC');
  console.log('   - Contest fetch: Every 6 hours');
  console.log('   - Reminder check: Every 5 minutes');
  
  // Run first sync after 1 minute to ensure data is fresh on startup
  setTimeout(() => {
    console.log('🚀 Running initial sync after startup...');
    syncAllUsers().catch(err => console.error('Initial sync failed:', err.message));
  }, 60000); // 1 minute delay

  return { dailySyncJob, weeklyReportJob, contestFetchJob, reminderJob };
};

/**
 * Process and send contest reminders
 */
const processContestReminders = async () => {
  try {
    const now = new Date();
    
    // Find reminders that should be sent now
    const reminders = await ContestReminder.find({
      reminderSent: false,
      reminderTime: { $lte: now }
    });

    if (reminders.length === 0) {
      return;
    }

    console.log(`📧 Processing ${reminders.length} contest reminders...`);

    for (const reminder of reminders) {
      try {
        // Send email
        const result = await sendContestReminder({
          to: reminder.email,
          contest: reminder.contestDetails
        });

        if (result.success) {
          // Mark as sent
          reminder.reminderSent = true;
          await reminder.save();
          console.log(`✅ Reminder sent for: ${reminder.contestDetails.name}`);
        } else {
          console.error(`❌ Failed to send reminder: ${result.error}`);
        }
      } catch (err) {
        console.error(`❌ Error processing reminder ${reminder._id}:`, err.message);
      }
    }

    console.log(`✅ Finished processing contest reminders`);
  } catch (error) {
    console.error('❌ Error in processContestReminders:', error.message);
  }
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  syncUserStats,
  syncAllUsers,
  manualSyncAll,
  generateWeeklyReport,
  generateAllWeeklyReports,
  startAllCronJobs,
  processContestReminders
};
