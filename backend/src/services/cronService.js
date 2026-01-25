const cron = require('node-cron');
const User = require('../models/User');
const { fetchAllPlatformStats, calculateAggregatedStats } = require('./aggregationService');
const { generateInsightsSummary } = require('./insightsService');

/**
 * Cron Job Service
 * Handles scheduled tasks like auto-syncing user stats
 */

let syncJob = null;

/**
 * Sync stats for a single user
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

    console.log(`🔄 Auto-syncing stats for user: ${user.username}`);
    
    await fetchAllPlatformStats(user);
    await calculateAggregatedStats(user._id);
    
    user.lastSynced = new Date();
    await user.save();
    
    console.log(`✅ Completed sync for user: ${user.username}`);
  } catch (error) {
    console.error(`❌ Error syncing user ${userId}:`, error.message);
  }
};

/**
 * Sync all active users
 */
const syncAllUsers = async () => {
  try {
    console.log('🚀 Starting scheduled sync for all users...');
    
    const users = await User.find({ isActive: true });
    console.log(`Found ${users.length} active users`);

    // Sync users in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(user => syncUserStats(user._id)));
      
      // Wait between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('✅ Completed scheduled sync for all users');
  } catch (error) {
    console.error('❌ Error in scheduled sync:', error.message);
  }
};

/**
 * Start the cron job
 * Default: Runs every day at 2 AM
 */
const startCronJobs = () => {
  // Schedule: Every day at 2 AM
  // Cron format: minute hour day month weekday
  syncJob = cron.schedule('0 2 * * *', syncAllUsers, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ Cron job started: Daily sync at 2:00 AM UTC');
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
 * Start all cron jobs (daily sync + weekly reports)
 */
const startAllCronJobs = () => {
  // Daily sync at 2 AM UTC
  const dailySyncJob = cron.schedule('0 2 * * *', syncAllUsers, {
    scheduled: true,
    timezone: 'UTC'
  });

  // Weekly reports on Sunday at 4 AM UTC
  const weeklyReportJob = cron.schedule('0 4 * * 0', generateAllWeeklyReports, {
    scheduled: true,
    timezone: 'UTC'
  });

  console.log('⏰ Cron jobs started:');
  console.log('   - Daily sync: Every day at 2:00 AM UTC');
  console.log('   - Weekly reports: Sundays at 4:00 AM UTC');

  return { dailySyncJob, weeklyReportJob };
};

module.exports = {
  startCronJobs,
  stopCronJobs,
  syncUserStats,
  syncAllUsers,
  manualSyncAll,
  generateWeeklyReport,
  generateAllWeeklyReports,
  startAllCronJobs
};
