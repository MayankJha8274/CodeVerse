const { Queue } = require('bullmq');
const { getRedisClient } = require('../config/redisClient');

let emailQueue = null;

const getEmailQueue = () => {
  if (!emailQueue) {
    const redisClient = getRedisClient();
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
    }
  }
  return emailQueue;
};

// Initialize the queue when this module is loaded
getEmailQueue();

module.exports = {
  emailQueue: getEmailQueue(),
};
