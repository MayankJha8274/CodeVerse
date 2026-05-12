/*
  Soak test: create N due reminders, enqueue via cron, and drain the Mongo email queue.

  Default behavior is SAFE:
  - If SENDGRID_API_KEY is present, forces SendGrid sandbox mode (no delivery).
  - Otherwise forces Ethereal dev fallback (no real inbox delivery).

  Usage (PowerShell):
    $env:MONGODB_URI='mongodb://127.0.0.1:27017/codeverse_soak'
    node scripts/soak-contest-reminders.js --count 100

  Optional:
    node scripts/soak-contest-reminders.js --count 100 --provider sendgrid-sandbox
    node scripts/soak-contest-reminders.js --count 100 --provider ethereal

  NOT recommended (will attempt real sends):
    node scripts/soak-contest-reminders.js --count 100 --provider smtp-real
*/

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const crypto = require('crypto');
const mongoose = require('mongoose');

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  if (!val || val.startsWith('--')) return fallback;
  return val;
}

function getIntArg(name, fallback) {
  const raw = getArg(name, undefined);
  if (raw === undefined) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function shortTag(prefix = 'soak') {
  const timePart = Date.now().toString(36).slice(-6);
  const randPart = crypto.randomBytes(3).toString('hex');
  return `${prefix}_${timePart}_${randPart}`; // <= 4+1+6+1+6 = 18
}

function configureSafeProvider(provider) {
  const hasSendgrid = !!process.env.SENDGRID_API_KEY;
  const mode = provider || (hasSendgrid ? 'sendgrid-sandbox' : 'ethereal');

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.REDIS_ENABLED = 'false';

  if (mode === 'sendgrid-sandbox') {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is missing but provider=sendgrid-sandbox requested');
    }
    process.env.SENDGRID_SANDBOX_MODE = 'true';
    // Speed up draining by allowing higher local throughput.
    process.env.EMAIL_RATE_MAX = process.env.EMAIL_RATE_MAX || '1000';
    process.env.EMAIL_RATE_DURATION = process.env.EMAIL_RATE_DURATION || '60000';
    return mode;
  }

  if (mode === 'ethereal') {
    // Force ethereal by clearing any real provider settings
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_SANDBOX_MODE;
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    delete process.env.EMAIL_SERVICE;

    process.env.EMAIL_RATE_MAX = process.env.EMAIL_RATE_MAX || '1000';
    process.env.EMAIL_RATE_DURATION = process.env.EMAIL_RATE_DURATION || '60000';
    return mode;
  }

  if (mode === 'smtp-real') {
    // Dangerous: will attempt real sends.
    // Keep existing env values.
    return mode;
  }

  throw new Error(`Unknown provider mode: ${mode}`);
}

(async () => {
  const count = Math.max(1, getIntArg('--count', 100));
  const provider = getArg('--provider', undefined);
  const mongo = process.env.MONGODB_URI;

  if (!mongo) {
    console.error('❌ MONGODB_URI missing. Set it to a local/isolated DB for soak testing.');
    process.exit(1);
  }

  const mode = configureSafeProvider(provider);

  // IMPORTANT: require queue modules after env is configured (they read env at import time)
  const User = require('../src/models/User');
  const Contest = require('../src/models/Contest');
  const ContestReminder = require('../src/models/ContestReminder');
  const EmailJob = require('../src/models/EmailJob');

  const { processContestReminders } = require('../src/services/cronService');
  const emailQueueMongo = require('../src/queues/emailQueueMongo');

  const tag = shortTag('soak');
  const createdReminderIds = [];
  const createdUserIds = [];
  let createdContestId = null;

  try {
    console.log('🔌 Mongo:', mongo);
    console.log('📧 Provider mode:', mode);
    console.log('📦 Creating reminders:', count);

    await mongoose.connect(mongo);

    const contestStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const contest = await Contest.create({
      name: `Soak Contest ${tag}`,
      platform: 'leetcode',
      url: 'https://example.com/contest',
      startTime: contestStart,
      duration: 120,
      contestId: `soak-${tag}`
    });
    createdContestId = contest._id;

    const baseNow = Date.now();

    for (let i = 1; i <= count; i++) {
      const uTag = `${tag}_${i}`;
      const username = `u_${baseNow.toString(36).slice(-6)}_${i}`;
      const email = `${uTag}@example.com`;

      const user = await User.create({
        username,
        email,
        password: 'password123',
        fullName: `Soak User ${i}`
      });
      createdUserIds.push(user._id);

      const reminder = await ContestReminder.create({
        userId: user._id,
        contestId: contest._id,
        email: user.email,
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

      createdReminderIds.push(reminder._id);
      if (i % 10 === 0) console.log(`...created ${i}/${count}`);
    }

    console.log('⏰ Enqueueing via processContestReminders()...');
    await processContestReminders();

    const queuedCount = await ContestReminder.countDocuments({ _id: { $in: createdReminderIds }, status: 'queued' });
    console.log('📬 Reminders queued:', queuedCount, '/', count);

    console.log('⚙️ Draining Mongo email queue...');
    let processed = 0;
    while (true) {
      const did = await emailQueueMongo._processOneJob();
      if (!did) break;
      processed += 1;
      if (processed % 10 === 0) console.log(`...processed ${processed}`);
    }

    const doneReminders = await ContestReminder.countDocuments({ _id: { $in: createdReminderIds }, status: 'done', reminderSent: true });
    const failedReminders = await ContestReminder.countDocuments({ _id: { $in: createdReminderIds }, status: 'failed' });

    const doneJobs = await EmailJob.countDocuments({ 'meta.reminderId': { $in: createdReminderIds }, status: 'done' });
    const failedJobs = await EmailJob.countDocuments({ 'meta.reminderId': { $in: createdReminderIds }, status: 'failed' });

    console.log('🏁 Results:', {
      reminders: { done: doneReminders, failed: failedReminders, total: count },
      jobs: { done: doneJobs, failed: failedJobs, total: count }
    });

    if (mode !== 'smtp-real') {
      if (doneReminders !== count) {
        throw new Error('Soak did not complete all reminders to done. Check logs/states above.');
      }
      console.log('✅ Soak passed: all reminders reached done using safe provider mode.');
    } else {
      console.log('ℹ️ smtp-real mode used; verify deliverability externally.');
    }

  } catch (err) {
    console.error('❌ Soak error:', err?.message || err);
    process.exitCode = 2;
  } finally {
    if (mongoose.connection?.readyState === 1) {
      // Cleanup created docs to avoid polluting DB
      await Promise.all([
        require('../src/models/EmailJob').deleteMany({ 'meta.reminderId': { $in: createdReminderIds } }).catch(() => {}),
        require('../src/models/ContestReminder').deleteMany({ _id: { $in: createdReminderIds } }).catch(() => {}),
        require('../src/models/User').deleteMany({ _id: { $in: createdUserIds } }).catch(() => {}),
        createdContestId ? require('../src/models/Contest').deleteMany({ _id: createdContestId }).catch(() => {}) : Promise.resolve(),
      ]);

      await mongoose.disconnect();
      console.log('🧹 Cleanup done; disconnected from Mongo');
    }
  }
})();
