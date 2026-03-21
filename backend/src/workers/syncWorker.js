/**
 * Sync Worker
 * BullMQ worker that processes platform sync jobs
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { createWorkerConnection } = require('../config/redis');
const { syncLogger } = require('../services/loggerService');
const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const {
  fetchPlatformData,
  fetchAllPlatformStats,
  calculateAggregatedStats
} = require('../services/aggregationService');
const { PLATFORM_DELAYS, PLATFORM_COOLDOWNS } = require('../queues/syncQueue');
const { clearUserCache } = require('../middleware/redisCache');

// Socket.io client for real-time updates (optional)
let io = null;

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Emit sync status to connected clients
 */
const emitSyncStatus = (userId, status, data = {}) => {
  if (io) {
    io.to(`user:${userId}`).emit('sync:status', {
      status,
      ...data,
      timestamp: new Date()
    });
  }
};

/**
 * Check if platform is on cooldown
 */
const isPlatformOnCooldown = (user, platform) => {
  const lastSyncTime = user.platformSyncTimes?.[platform];
  if (!lastSyncTime) return false;

  const cooldown = PLATFORM_COOLDOWNS[platform] || 10 * 60 * 1000;
  const elapsed = Date.now() - new Date(lastSyncTime).getTime();

  return elapsed < cooldown;
};

/**
 * Process a single platform sync
 */
const syncSinglePlatform = async (user, platform, job) => {
  const username = user.platforms?.[platform];
  if (!username) {
    return { platform, success: false, error: 'Platform not linked', skipped: true };
  }

  // Check cooldown
  if (isPlatformOnCooldown(user, platform)) {
    const lastSync = user.platformSyncTimes[platform];
    const cooldown = PLATFORM_COOLDOWNS[platform];
    const remaining = Math.ceil((cooldown - (Date.now() - new Date(lastSync).getTime())) / 1000);

    syncLogger.info(`Platform ${platform} on cooldown`, { userId: user._id, remaining });
    return {
      platform,
      success: true,
      skipped: true,
      reason: `On cooldown (${remaining}s remaining)`
    };
  }

  const startTime = Date.now();

  try {
    // Report progress
    await job.updateProgress({ platform, status: 'fetching' });
    emitSyncStatus(user._id, 'syncing', { platform, progress: 'fetching' });

    // Fetch platform data
    const result = await fetchPlatformData(platform, username, process.env.GITHUB_TOKEN);
    const duration = Date.now() - startTime;

    if (result.success) {
      // Check for suspicious zero data
      const existingRecord = await PlatformStats.findOne({ userId: user._id, platform });
      const newProblems = result.stats?.totalSolved || result.stats?.problemsSolved || 0;
      const oldProblems = existingRecord?.stats?.totalSolved || existingRecord?.stats?.problemsSolved || 0;
      const isSuspiciousZero = newProblems === 0 && oldProblems > 0;

      if (isSuspiciousZero) {
        syncLogger.warn(`Suspicious zero data for ${platform}`, {
          userId: user._id,
          oldProblems,
          newProblems
        });
        // Keep old data, only update timestamp
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform },
          { lastFetched: new Date(), fetchStatus: 'success', errorMessage: null },
          { upsert: true }
        );
      } else {
        // Save new stats
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform },
          {
            userId: user._id,
            platform,
            stats: result.stats,
            lastFetched: new Date(),
            fetchStatus: 'success',
            errorMessage: null
          },
          { upsert: true }
        );
      }

      // Update platform sync time
      await User.findByIdAndUpdate(user._id, {
        [`platformSyncTimes.${platform}`]: new Date()
      });

      syncLogger.platformFetch(user._id, platform, true, duration);
      return { platform, success: true, duration, stats: result.stats };
    } else {
      // Preserve existing stats on failure
      const existingStats = await PlatformStats.findOne({ userId: user._id, platform });
      await PlatformStats.findOneAndUpdate(
        { userId: user._id, platform },
        {
          userId: user._id,
          platform,
          lastFetched: new Date(),
          fetchStatus: 'failed',
          errorMessage: result.error,
          ...(existingStats?.stats && { stats: existingStats.stats })
        },
        { upsert: true }
      );

      syncLogger.platformFetch(user._id, platform, false, duration, { message: result.error });
      return { platform, success: false, error: result.error, duration };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    syncLogger.platformFetch(user._id, platform, false, duration, error);

    // Preserve existing stats on exception
    const existingStats = await PlatformStats.findOne({ userId: user._id, platform });
    await PlatformStats.findOneAndUpdate(
      { userId: user._id, platform },
      {
        userId: user._id,
        platform,
        lastFetched: new Date(),
        fetchStatus: 'failed',
        errorMessage: error.message,
        ...(existingStats?.stats && { stats: existingStats.stats })
      },
      { upsert: true }
    );

    return { platform, success: false, error: error.message, duration };
  }
};

/**
 * Main sync job processor
 */
const processSyncJob = async (job) => {
  const { userId, platform, hardReset, triggeredBy } = job.data;
  const startTime = Date.now();

  syncLogger.syncStart(userId, platform, triggeredBy);

  try {
    // Update user sync status
    await User.findByIdAndUpdate(userId, {
      syncStatus: 'syncing',
      lastSyncError: null
    });

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    emitSyncStatus(userId, 'syncing', { platform: platform || 'all' });

    let results = [];

    // Hard reset if requested
    if (hardReset) {
      syncLogger.info('Hard reset requested', { userId });
      await PlatformStats.deleteMany({ userId: user._id });
      const DailyProgress = require('../models/DailyProgress');
      await DailyProgress.deleteMany({ userId: user._id });
    }

    if (platform) {
      // Sync single platform
      const result = await syncSinglePlatform(user, platform, job);
      results.push(result);
    } else {
      // Sync all platforms with delays
      const platforms = Object.keys(user.platforms).filter(p => user.platforms[p]);

      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];

        // Report progress
        await job.updateProgress({
          current: i + 1,
          total: platforms.length,
          platform: p
        });

        const result = await syncSinglePlatform(user, p, job);
        results.push(result);

        // Add platform-specific delay between calls
        if (i < platforms.length - 1 && !result.skipped) {
          const platformDelay = PLATFORM_DELAYS[p] || 1000;
          await delay(platformDelay);
        }
      }
    }

    // Calculate aggregated stats
    const aggregated = await calculateAggregatedStats(user._id);

    // Update user record
    await User.findByIdAndUpdate(userId, {
      lastSynced: new Date(),
      lastSyncedAt: new Date(),
      syncStatus: 'completed',
      lastSyncError: null,
      lastActivityAt: new Date()
    });
    
    // 🚀 NEW: Clear Redis Cache so UI gets updated data immediately on reload
    await clearUserCache(userId);

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success && !r.skipped).length;
    const failedCount = results.filter(r => !r.success && !r.skipped).length;

    syncLogger.syncComplete(userId, platform, duration, {
      total: results.length,
      success: successCount,
      failed: failedCount,
      aggregated: {
        totalProblems: aggregated.totalProblemsSolved,
        totalCommits: aggregated.totalCommits
      }
    });

    emitSyncStatus(userId, 'completed', {
      results,
      aggregated,
      duration
    });

    return {
      success: true,
      results,
      aggregated,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Update user sync status
    await User.findByIdAndUpdate(userId, {
      syncStatus: 'failed',
      lastSyncError: error.message
    });

    syncLogger.syncFailed(userId, platform, error, job.attemptsMade);
    emitSyncStatus(userId, 'failed', { error: error.message });

    throw error; // Re-throw to trigger retry
  }
};

/**
 * Initialize and start the worker
 */
const startWorker = async () => {
  // Connect to MongoDB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for worker');
  }

  const connection = createWorkerConnection();

  const worker = new Worker('platform-sync', processSyncJob, {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 3,
    limiter: {
      max: 10,
      duration: 60000 // Max 10 jobs per minute
    }
  });

  worker.on('completed', (job, result) => {
    syncLogger.queueEvent('completed', job.id, {
      userId: job.data.userId,
      duration: result?.duration
    });
  });

  worker.on('failed', (job, error) => {
    syncLogger.queueEvent('failed', job.id, {
      userId: job?.data?.userId,
      error: error.message,
      attempts: job?.attemptsMade
    });
  });

  worker.on('progress', (job, progress) => {
    syncLogger.queueEvent('progress', job.id, { progress });
  });

  worker.on('error', (error) => {
    syncLogger.error('Worker error', { error: error.message });
  });

  console.log('✅ Sync worker started');
  console.log(`📋 Concurrency: ${process.env.WORKER_CONCURRENCY || 3}`);
  console.log('🔄 Listening for jobs...');

  return worker;
};

/**
 * Set Socket.io instance for real-time updates
 */
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Start worker if run directly
if (require.main === module) {
  startWorker().catch(err => {
    console.error('Failed to start worker:', err);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
  setSocketIO,
  processSyncJob
};
