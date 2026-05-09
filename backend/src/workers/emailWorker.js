/**
 * Email Worker
 * BullMQ worker that processes mass email jobs (24h/6h contest reminders)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Worker } = require('bullmq');
const { createWorkerConnection } = require('../config/redis');
const { sendEmail } = require('../services/emailService');
const ContestReminder = require('../models/ContestReminder');

let worker = null;
let workerConnection = null;

const processEmailJob = async (job) => {
  const { to, subject, html, reminderId } = job.data;
  console.log(`[EmailWorker] Processing email job for: ${to}`);

  try {
    await sendEmail({ to, subject, html });

    if (reminderId) {
      await ContestReminder.updateOne(
        { _id: reminderId },
        { $set: { reminderSent: true, status: 'done', lockedUntil: null, lastError: null } }
      );
    }
    console.log(`[EmailWorker] Successfully sent email to ${to}`);
    // Rate limiting is handled by BullMQ limiter; no extra sleep needed.
    return { success: true };
  } catch (error) {
    console.error(`[EmailWorker] Failed to send email to ${to}:`, error.message);

    if (reminderId) {
      try {
        // Keep reminder as queued while BullMQ retries; mark failed on final failure below.
        await ContestReminder.updateOne(
          { _id: reminderId },
          { $set: { lastError: error?.message || String(error) } }
        );
      } catch (_) {
        // ignore
      }
    }

    // The error will be re-thrown, and BullMQ will handle the job failure.
    throw error;
  }
};

const startEmailWorker = async () => {
  const connection = createWorkerConnection();
  if (!connection) {
    console.error('❌ Could not create Redis connection for email worker. Is Redis running?');
    return;
  }

  workerConnection = connection;
  
  const concurrency = parseInt(process.env.EMAIL_WORKER_CONCURRENCY, 10) || 5;
  const limiterMax = parseInt(process.env.EMAIL_RATE_MAX, 10) || 10;
  const limiterDuration = parseInt(process.env.EMAIL_RATE_DURATION, 10) || 60000;

  worker = new Worker('email-queue', processEmailJob, {
    connection,
    concurrency,
    limiter: {
      max: limiterMax,
      duration: limiterDuration,
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ [EmailWorker] Job ${job.id} for ${job.data.to} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ [EmailWorker] Job ${job.id} for ${job.data.to} failed:`, err.message);

    const reminderId = job?.data?.reminderId;
    const isFinal = job?.opts?.attempts && job.attemptsMade >= job.opts.attempts;
    if (reminderId && isFinal) {
      ContestReminder.updateOne(
        { _id: reminderId },
        { $set: { status: 'failed', lockedUntil: null, lastError: err?.message || String(err) } }
      ).catch(() => {});
    }
  });

  console.log('✅ Email worker started & listening to the email-queue...');
};

const stopEmailWorker = async () => {
  try {
    if (worker) {
      await worker.close();
      worker = null;
    }
  } catch (err) {
    console.warn('⚠️ Failed to close BullMQ worker:', err?.message || err);
  }

  try {
    if (workerConnection) {
      await workerConnection.quit();
      workerConnection = null;
    }
  } catch (err) {
    // ignore
  }
};

module.exports = {
  startEmailWorker,
  stopEmailWorker,
};
