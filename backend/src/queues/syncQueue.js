/**
 * Sync Queue Configuration
 * Handles job queuing for platform synchronization
 * Queue is OPTIONAL - works without Redis using direct sync
 */

const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redisClient');

let syncQueue = null;

const getSyncQueue = () => {
  if (!syncQueue) {
    const redisClient = getRedisClient();
    if (redisClient) {
      syncQueue = new Queue('sync-queue', {
        connection: redisClient,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 10000, // 10 seconds
          },
          removeOnComplete: {
            count: 1000,
            age: 3600 * 24, // 24 hours
          },
          removeOnFail: {
            count: 5000,
            age: 3600 * 24 * 7, // 7 days
          },
        },
      });
    }
  }
  return syncQueue;
};

const addSyncJob = async (userId, options = {}) => {
  const queue = getSyncQueue();
  if (queue) {
    try {
      await queue.add('sync-user', { userId }, options);
      console.log(`✅ Queued sync for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to add sync job for user ${userId}:`, error.message);
    }
  } else {
    console.warn('⚠️ Sync queue not available. Sync job was not added.');
    // Optionally, you could fall back to a direct, non-queued call here
  }
};

module.exports = {
  getSyncQueue,
  addSyncJob,
};
  LOW: 10     // Inactive users
};

let syncQueue = null;
let queueEvents = null;
let queueInitialized = false;
let queueAvailable = false;

/**
 * Initialize the sync queue (only if Redis is available)
 */
const initSyncQueue = () => {
  if (queueInitialized) {
    return queueAvailable ? syncQueue : null;
  }

  queueInitialized = true;

  if (!isRedisAvailable()) {
    console.log('ℹ️ Queue disabled (Redis not configured). Using direct sync mode.');
    queueAvailable = false;
    return null;
  }

  try {
    const { Queue, QueueEvents } = require('bullmq');
    const connection = getRedisConnection();

    if (!connection) {
      queueAvailable = false;
      return null;
    }

    syncQueue = new Queue('platform-sync', {
      connection,
      defaultJobOptions
    });

    // Queue events for monitoring
    queueEvents = new QueueEvents('platform-sync', { connection });

    queueEvents.on('completed', ({ jobId }) => {
      console.log(`✅ Job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ Job ${jobId} failed: ${failedReason}`);
    });

    queueAvailable = true;
    console.log('✅ Sync queue initialized');
    return syncQueue;
  } catch (err) {
    console.warn('⚠️ Queue initialization failed:', err.message);
    queueAvailable = false;
    return null;
  }
};

/**
 * Check if queue is available
 */
const isQueueAvailable = () => {
  if (!queueInitialized) {
    initSyncQueue();
  }
  return queueAvailable;
};

/**
 * Add a user sync job to the queue
 */
const addSyncJob = async (userId, options = {}) => {
  if (!isQueueAvailable()) {
    return null;
  }

  const queue = syncQueue;

  const {
    platform = null,
    priority = PRIORITY.NORMAL,
    hardReset = false,
    triggeredBy = 'system'
  } = options;

  const jobData = {
    userId: userId.toString(),
    platform,
    hardReset,
    triggeredBy,
    timestamp: Date.now()
  };

  const jobOptions = {
    ...defaultJobOptions,
    priority,
    jobId: platform
      ? `sync-${userId}-${platform}-${Date.now()}`
      : `sync-${userId}-all-${Date.now()}`
  };

  try {
    const job = await queue.add('sync-user', jobData, jobOptions);
    console.log(`📋 Added sync job: ${job.id} (priority: ${priority})`);
    return job;
  } catch (err) {
    console.error('Failed to add sync job:', err.message);
    return null;
  }
};

/**
 * Add batch sync jobs for multiple users
 */
const addBatchSyncJobs = async (userIds, options = {}) => {
  if (!isQueueAvailable()) {
    return [];
  }

  const queue = syncQueue;
  const jobs = [];
  const { priority = PRIORITY.NORMAL, triggeredBy = 'cron' } = options;

  for (const userId of userIds) {
    const jobData = {
      userId: userId.toString(),
      platform: null,
      hardReset: false,
      triggeredBy,
      timestamp: Date.now()
    };

    jobs.push({
      name: 'sync-user',
      data: jobData,
      opts: {
        ...defaultJobOptions,
        priority,
        jobId: `sync-${userId}-batch-${Date.now()}`
      }
    });
  }

  try {
    const addedJobs = await queue.addBulk(jobs);
    console.log(`📋 Added ${addedJobs.length} batch sync jobs`);
    return addedJobs;
  } catch (err) {
    console.error('Failed to add batch sync jobs:', err.message);
    return [];
  }
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  if (!isQueueAvailable()) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      available: false
    };
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      syncQueue.getWaitingCount(),
      syncQueue.getActiveCount(),
      syncQueue.getCompletedCount(),
      syncQueue.getFailedCount(),
      syncQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + delayed,
      available: true
    };
  } catch (err) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      available: false
    };
  }
};

/**
 * Clear all jobs from queue (for maintenance)
 */
const clearQueue = async () => {
  if (!isQueueAvailable()) return;

  try {
    await syncQueue.obliterate({ force: true });
    console.log('🗑️ Queue cleared');
  } catch (err) {
    console.error('Failed to clear queue:', err.message);
  }
};

/**
 * Get the sync queue instance
 */
const getSyncQueue = () => {
  return isQueueAvailable() ? syncQueue : null;
};

module.exports = {
  initSyncQueue,
  getSyncQueue,
  addSyncJob,
  addBatchSyncJobs,
  getQueueStats,
  clearQueue,
  isQueueAvailable,
  PLATFORM_DELAYS,
  PLATFORM_COOLDOWNS,
  PRIORITY
};
