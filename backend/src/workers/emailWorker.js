/**
 * Email Worker
 * BullMQ worker that processes mass email jobs (24h/6h contest reminders)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { createWorkerConnection } = require('../config/redis');
const User = require('../models/User');
const Contest = require('../models/Contest');
const NotificationLog = require('../models/NotificationLog');
const { sendContestReminder } = require('../services/emailService');

let worker = null;

const processEmailJob = async (job) => {
  const { contestId, type } = job.data;
  console.log(`[EmailWorker] Processing ${type} reminder for contest ${contestId}...`);

  try {
    const contest = await Contest.findById(contestId);
    if (!contest) {
      console.log(`[EmailWorker] Contest ${contestId} not found, skipping.`);
      return;
    }

    // 1. Fetch opted-in users
    // Criteria: notifyContests = true, isVerified = true
    const users = await User.find({
      'settings.emailNotifications': true,
      'settings.notifyContests': true,
      isVerified: true
    }).select('email username _id');

    console.log(`[EmailWorker] Found ${users.length} eligible users.`);

    let sentCount = 0;
    let skipCount = 0;
    
    // 2. Iterate users and send email if not sent before
    for (const user of users) {
      // Check NotificationLog
      const existingLog = await NotificationLog.findOne({
        userId: user._id,
        contestId: contest._id,
        type: type
      });

      if (existingLog) {
        skipCount++;
        continue;
      }

      // Prepare contest data matching emailService format
      // Passing user info to potentially personalize if needed
      const result = await sendContestReminder({
        to: user.email,
        contest: contest,
        type: type,
        username: user.username
      });

      if (result.success) {
        // Construct log
        await NotificationLog.create({
          userId: user._id,
          contestId: contest._id,
          type: type,
          sent: true
        });
        sentCount++;
      } else {
        console.error(`[EmailWorker] Failed to send ${type} reminder to ${user.email}`);
      }
      
      // Delay (rate-limiting) -- e.g., max 10 emails/sec 
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms
    }

    console.log(`[EmailWorker] Finished ${type} reminder for ${contest.name}: Sent -> ${sentCount}, Skipped -> ${skipCount}`);
    return { success: true, sent: sentCount, skipped: skipCount };

  } catch (error) {
    console.error(`[EmailWorker] Job failed: ${error.message}`);
    throw error;
  }
};

const startEmailWorker = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for email worker');
  }

  const connection = createWorkerConnection();
  worker = new Worker('email-queue', processEmailJob, {
    connection,
    concurrency: 1 // Single worker
  });

  worker.on('completed', (job, result) => {
    console.log(`✅ [EmailWorker] Job ${job.id} completed. Sent: ${result.sent}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job ${job.id} failed:`, err.message);
  });

  console.log('✅ Email worker started & listening to queue...');
};

module.exports = {
  startEmailWorker
};
