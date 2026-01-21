const cron = require('node-cron');
const User = require('../models/User');
const { fetchAllPlatformStats, calculateAggregatedStats } = require('./aggregationService');

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

module.exports = {
  startCronJobs,
  stopCronJobs,
  syncUserStats,
  syncAllUsers,
  manualSyncAll
};
