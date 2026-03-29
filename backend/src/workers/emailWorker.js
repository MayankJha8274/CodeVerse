/**
 * Email Worker
 * BullMQ worker that processes mass email jobs (24h/6h contest reminders)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const { getRedisClient } = require('../config/redisClient');
const { sendEmail } = require('../services/emailService');

let worker = null;

const processEmailJob = async (job) => {
  const { to, subject, html } = job.data;
  console.log(`[EmailWorker] Processing email job for: ${to}`);

  try {
    await sendEmail({ to, subject, html });
    console.log(`[EmailWorker] Successfully sent email to ${to}`);
    // Add a small delay to avoid hitting rate limits if jobs are processed very quickly
    await new Promise(res => setTimeout(res, 5000)); // 5-second delay
    return { success: true };
  } catch (error) {
    console.error(`[EmailWorker] Failed to send email to ${to}:`, error.message);
    // The error will be re-thrown, and BullMQ will handle the job failure.
    throw error;
  }
};

const startEmailWorker = async () => {
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected for email worker');
    } catch (error) {
      console.error('❌ MongoDB connection failed for email worker:', error);
      process.exit(1);
    }
  }

  const connection = getRedisClient();
  if (!connection) {
    console.error('❌ Could not create Redis connection for email worker. Is Redis running?');
    return;
  }
  
  worker = new Worker('email-queue', processEmailJob, {
    connection,
    concurrency: 5, // Process up to 5 emails concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per 60 seconds
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ [EmailWorker] Job ${job.id} for ${job.data.to} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job ${job.id} for ${job.data.to} failed:`, err.message);
  });

  console.log('✅ Email worker started & listening to the email-queue...');
};

module.exports = {
  startEmailWorker,
};
