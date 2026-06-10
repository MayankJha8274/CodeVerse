/**
 * Email Mongo Worker
 * Runs the Mongo-backed email queue worker as a standalone process.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), override: true });
const mongoose = require('mongoose');
const emailQueueMongo = require('../queues/emailQueueMongo');

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI missing in environment');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for Email Mongo Worker');

    await emailQueueMongo.startWorker();

    // keep process alive
    process.on('SIGINT', async () => {
      console.log('🛑 Stopping Email Mongo Worker...');
      await emailQueueMongo.stopWorker();
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Email Mongo Worker failed to start:', err);
    process.exit(1);
  }
}

main();
