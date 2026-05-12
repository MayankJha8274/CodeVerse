/*
  Smoke: end-to-end contest reminder flow (reminder → cron enqueue → mongo worker → done)

  This script:
  - connects to Mongo
  - inserts a temporary User/Contest/ContestReminder due NOW
  - runs processContestReminders() once (enqueues EmailJob)
  - processes exactly one EmailJob via emailQueueMongo._processOneJob()
  - prints final statuses
  - cleans up all inserted docs (best-effort)

  Usage (PowerShell):
    # Prefer local isolated DB if Mongo is running
    $env:MONGODB_URI='mongodb://127.0.0.1:27017/codeverse_smoke'
    $env:EMAIL_USER='your@gmail.com'
    $env:EMAIL_PASSWORD='app-password'
    node scripts/smoke-contest-reminder.js --to mayankjha8274@gmail.com

  Notes:
  - If no real email credentials are set and NODE_ENV != production, emailService will use Ethereal.
    That validates the pipeline but will NOT deliver to Gmail inbox.
*/

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Contest = require('../src/models/Contest');
const ContestReminder = require('../src/models/ContestReminder');
const EmailJob = require('../src/models/EmailJob');

const { processContestReminders } = require('../src/services/cronService');
const emailQueueMongo = require('../src/queues/emailQueueMongo');

function detectProvider() {
  if (process.env.SENDGRID_API_KEY) return 'sendgrid';
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) return 'smtp';
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) return `smtp-service:${process.env.EMAIL_SERVICE || 'gmail'}`;
  return 'ethereal-dev-fallback';
}

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return fallback;
  return val;
}

function assertEnv() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Set it in environment or in backend/.env');
  }
}

async function safeDelete(model, filter) {
  try {
    await model.deleteMany(filter);
  } catch (_) {
    // ignore
  }
}

(async () => {
  let smokeTag = null;
  let createdUserId = null;
  let createdContestId = null;
  let createdReminderId = null;

  try {
    assertEnv();

    const to = getArg('--to', process.env.SMOKE_TO);
    if (!to) {
      console.error('❌ Missing recipient. Provide --to <email> or set SMOKE_TO');
      process.exit(1);
    }

    // Keep tags short to satisfy schema constraints (username max length 30)
    const timePart = Date.now().toString(36).slice(-6);
    const randPart = crypto.randomBytes(3).toString('hex');
    smokeTag = `smk_${timePart}_${randPart}`; // <= 3+1+6+1+6 = 17 chars

    console.log('🔌 Connecting to Mongo:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);

    // 1) Create temp user
    const user = await User.create({
      username: smokeTag,
      email: `${smokeTag}@example.com`,
      password: 'smoke_password_123',
      fullName: 'Smoke Test User'
    });
    createdUserId = user._id;

    // 2) Create temp contest
    const contestStart = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2h (not used by cron, but template uses it)
    const contest = await Contest.create({
      name: `Smoke Contest ${smokeTag}`,
      platform: 'leetcode',
      url: 'https://example.com/contest',
      startTime: contestStart,
      duration: 120,
      contestId: `smoke-${smokeTag}`
    });
    createdContestId = contest._id;

    // 3) Create due reminder (reminderTime <= now)
    const reminder = await ContestReminder.create({
      userId: user._id,
      contestId: contest._id,
      email: to,
      reminderSent: false,
      status: 'pending',
      lockedUntil: null,
      lastError: null,
      reminderTime: new Date(Date.now() - 1000),
      contestDetails: {
        name: contest.name,
        platform: contest.platform,
        url: contest.url,
        startTime: contest.startTime,
        duration: contest.duration,
      }
    });
    createdReminderId = reminder._id;

    console.log('✅ Inserted smoke docs:', {
      userId: String(createdUserId),
      contestId: String(createdContestId),
      reminderId: String(createdReminderId),
      to
    });

    console.log('📧 Provider mode:', detectProvider());

    // 4) Run cron processor once to enqueue
    await processContestReminders();

    const reminderAfterCron = await ContestReminder.findById(createdReminderId).lean();
    const emailJobKey = `contest-reminder:${createdReminderId}`;
    const jobAfterCron = await EmailJob.findOne({ jobKey: emailJobKey }).lean();

    console.log('📌 After processContestReminders():', {
      reminderStatus: reminderAfterCron?.status,
      reminderSent: reminderAfterCron?.reminderSent,
      lastError: reminderAfterCron?.lastError,
      emailJobStatus: jobAfterCron?.status,
      emailJobAttempts: jobAfterCron?.attempts,
    });

    if (!jobAfterCron) {
      throw new Error('Expected an EmailJob to be enqueued, but none was found. Check logs for enqueue failure.');
    }

    // 5) Process exactly one job deterministically
    const processed = await emailQueueMongo._processOneJob();
    console.log('⚙️ emailQueueMongo._processOneJob() processed:', processed);

    const reminderAfterWorker = await ContestReminder.findById(createdReminderId).lean();
    const jobAfterWorker = await EmailJob.findOne({ jobKey: emailJobKey }).lean();

    console.log('🏁 Final:', {
      reminderStatus: reminderAfterWorker?.status,
      reminderSent: reminderAfterWorker?.reminderSent,
      reminderLastError: reminderAfterWorker?.lastError,
      emailJobStatus: jobAfterWorker?.status,
      emailJobAttempts: jobAfterWorker?.attempts,
    });

    if (reminderAfterWorker?.status !== 'done' || reminderAfterWorker?.reminderSent !== true) {
      throw new Error('Smoke test failed: reminder did not reach done/sent. See output above.');
    }

    console.log('✅ Smoke test passed (pipeline + provider handoff). Check inbox/spam for delivery.');

  } catch (err) {
    console.error('❌ Smoke test error:', err?.message || err);
    process.exitCode = 2;
  } finally {
    // best-effort cleanup
    if (mongoose.connection?.readyState === 1) {
      await safeDelete(EmailJob, { 'meta.reminderId': createdReminderId });
      await safeDelete(ContestReminder, { _id: createdReminderId });
      await safeDelete(Contest, { _id: createdContestId });
      await safeDelete(User, { _id: createdUserId });
      await mongoose.disconnect();
      console.log('🧹 Cleanup done; disconnected from Mongo');
    }
  }
})();
