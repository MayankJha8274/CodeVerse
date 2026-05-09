require('dotenv').config({ path: require('path').join(__dirname, './.env') });
const mongoose = require('mongoose');
const { processContestReminders } = require('./src/services/cronService');
const { emailQueue } = require('./src/queues/emailQueue');

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse-test';

async function main() {
  try {
    await mongoose.connect(MONGO);
    console.log('✅ Connected to MongoDB');

    console.log('🚀 Running processContestReminders() now...');
    await processContestReminders();

    console.log('🟡 Waiting for in-memory email queue to drain (max 5 minutes)...');
    const start = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    // If using in-memory fallback, poll the helper. If using BullMQ, skip wait.
    if (emailQueue && typeof emailQueue._getQueueSize === 'function') {
      while (true) {
        const size = emailQueue._getQueueSize();
        console.log(`📊 In-memory queue size: ${size}`);
        if (size === 0) break;
        if (Date.now() - start > timeout) {
          console.warn('⚠️ Timeout waiting for in-memory queue to drain');
          break;
        }
        // wait 1s
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    console.log('🟢 processContestReminders() finished');
    await mongoose.disconnect();
    console.log('🛑 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error running reminders:', err);
    process.exit(1);
  }
}

main();
