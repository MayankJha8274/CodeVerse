/**
 * Mongo-backed durable email queue.
 * - Adds jobs into `EmailJob` collection.
 * - Background worker polls `pending` jobs, claims them atomically, and sends via `emailService.sendEmail`.
 * - Implements attempts/backoff and respects a simple rate limiter.
 */

const EmailJob = require('../models/EmailJob');
const { sendEmail } = require('../services/emailService');
const ContestReminder = require('../models/ContestReminder');

const DEFAULT_RATE_MAX = parseInt(process.env.EMAIL_RATE_MAX, 10) || 10; // max emails
const DEFAULT_RATE_DURATION = parseInt(process.env.EMAIL_RATE_DURATION, 10) || 60000; // per ms window
const POLL_INTERVAL = 1000; // ms

let workerRunning = false;
let tokens = DEFAULT_RATE_MAX;
let lastRefill = Date.now();

function isDuplicateKeyError(err) {
  const code = err && (err.code || err.errno);
  return code === 11000;
}

// Simple token bucket refill
function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  if (elapsed <= 0) return;
  const refill = Math.floor(elapsed * (DEFAULT_RATE_MAX / DEFAULT_RATE_DURATION));
  if (refill > 0) {
    tokens = Math.min(DEFAULT_RATE_MAX, tokens + refill);
    lastRefill = now;
  }
}

async function processOneJob() {
  refillTokens();
  if (tokens <= 0) return false;

  // Atomically find one pending job whose nextAttemptAt <= now and mark processing
  const now = new Date();
  const job = await EmailJob.findOneAndUpdate(
    { status: 'pending', nextAttemptAt: { $lte: now } },
    { $set: { status: 'processing' }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, returnDocument: 'after' }
  );

  if (!job) return false;

  try {
    tokens -= 1;
    await sendEmail({ to: job.to, subject: job.subject, html: job.html });

    const reminderId = job?.meta?.reminderId;
    if (reminderId) {
      await ContestReminder.updateOne(
        { _id: reminderId },
        { $set: { reminderSent: true, status: 'done', lockedUntil: null, lastError: null } }
      );
    }

    job.status = 'done';
    await job.save();
    return true;
  } catch (err) {
    const reminderId = job?.meta?.reminderId;
    if (reminderId) {
      try {
        await ContestReminder.updateOne(
          { _id: reminderId },
          { $set: { lastError: err?.message || String(err) } }
        );
      } catch (_) {
        // ignore
      }
    }

    // schedule retry or mark failed
    if (job.attempts < job.maxAttempts) {
      const delay = Math.min(5000 * Math.pow(2, job.attempts - 1), 60 * 1000);
      job.status = 'pending';
      job.nextAttemptAt = new Date(Date.now() + delay);
    } else {
      job.status = 'failed';

      if (reminderId) {
        try {
          await ContestReminder.updateOne(
            { _id: reminderId },
            { $set: { status: 'failed', lockedUntil: null, lastError: err?.message || String(err) } }
          );
        } catch (_) {
          // ignore
        }
      }
    }
    await job.save();
    return false;
  }
}

async function startWorker() {
  if (workerRunning) return;
  workerRunning = true;
  lastRefill = Date.now();
  console.log('✅ EmailQueue(Mongo): Worker started (rate:', DEFAULT_RATE_MAX, 'per', DEFAULT_RATE_DURATION, 'ms)');

  const loop = async () => {
    try {
      while (await processOneJob()) {
        // keep processing while tokens and jobs available
      }
    } catch (err) {
      console.error('❌ EmailQueue(Mongo) worker loop error:', err.message || err);
    } finally {
      if (workerRunning) setTimeout(loop, POLL_INTERVAL);
    }
  };

  loop();
}

async function stopWorker() {
  workerRunning = false;
}

const emailQueueMongo = {
  add: async (jobName, data, opts = {}) => {
    const jobKeyRaw = opts && opts.jobId
      ? opts.jobId
      : (data && data.reminderId ? `${jobName}:${data.reminderId}` : undefined);
    const jobKey = (jobKeyRaw === undefined || jobKeyRaw === null) ? undefined : String(jobKeyRaw);

    const insertDoc = {
      ...(jobKey ? { jobKey } : {}),
      to: data.to,
      subject: data.subject,
      html: data.html,
      meta: { reminderId: data.reminderId },
      attempts: 0,
      maxAttempts: opts.attempts || 3,
      status: 'pending',
      nextAttemptAt: new Date(),
    };

    if (!jobKey) {
      const doc = new EmailJob(insertDoc);
      await doc.save();
      return doc;
    }

    // Idempotent add: if jobKey already exists, do not create another row.
    // Use $setOnInsert to preserve existing job state (e.g. processing/done/failed).
    try {
      const doc = await EmailJob.findOneAndUpdate(
        { jobKey },
        { $setOnInsert: insertDoc },
        { upsert: true, returnDocument: 'after' }
      );
      return doc;
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const existing = await EmailJob.findOne({ jobKey });
        if (existing) return existing;
      }
      throw err;
    }
  },
  startWorker,
  stopWorker,
};

module.exports = emailQueueMongo;
