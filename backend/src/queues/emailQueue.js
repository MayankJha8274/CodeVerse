const { Queue, QueueEvents } = require('bullmq');
const { getRedisConnection, isRedisAvailable } = require('../config/redis');

let emailQueue = null;
let queueEvents = null;

const getEmailQueue = () => {
  if (!emailQueue && isRedisAvailable()) {
    const redisClient = getRedisConnection();
    if (redisClient) {
      emailQueue = new Queue('email-queue', {
        connection: redisClient,
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 60000, // 1 minute
          },
          removeOnComplete: {
            count: 1000,
            age: 3600 * 24,
          },
          removeOnFail: {
            count: 5000,
            age: 3600 * 24 * 7,
          },
        },
      });

      // Add QueueEvents listener
      queueEvents = new QueueEvents('email-queue', { connection: redisClient });

      queueEvents.on('completed', ({ jobId }) => {
        console.log(`[Email Queue] Job ${jobId} completed successfully`);
      });

      queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`[Email Queue] Job ${jobId} failed with reason: ${failedReason}`);
      });
    }
  }
  return emailQueue;
};

// Initialize the queue when this module is loaded
getEmailQueue();

module.exports = {
  emailQueue: getEmailQueue(),
};
