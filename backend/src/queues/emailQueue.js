const { Queue } = require('bullmq');
const { isRedisAvailable, getRedisConnection } = require('../config/redis');

let emailQueue = null;

const initEmailQueue = async () => {
  if (!isRedisAvailable()) {
    console.log('⚠️ Redis disabled. Email Queue will not initialize.');
    return null;
  }

  const connection = getRedisConnection();
  emailQueue = new Queue('email-queue', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5s, 10s, 20s
      },
      removeOnComplete: {
        count: 100,
        age: 24 * 3600 // Keep for 24h
      },
      removeOnFail: {
        count: 500
      }
    }
  });

  console.log('✅ Email queue initialized');
  return emailQueue;
};

const getEmailQueue = () => emailQueue;

/**
 * Add an email reminder job to the queue
 */
const addEmailJob = async (jobData) => {
  if (!emailQueue) return false;

  const jobId = `reminder-${jobData.contestId}-${jobData.type}`;
  
  try {
    await emailQueue.add('send-reminder', jobData, {
      jobId, 
      priority: 3
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to add email job:', error.message);
    return false;
  }
};

module.exports = {
  initEmailQueue,
  getEmailQueue,
  addEmailJob
};
