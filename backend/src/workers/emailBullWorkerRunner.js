/**
 * Email Bull Worker Runner
 * Standalone process that runs the BullMQ email worker.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { startEmailWorker, stopEmailWorker } = require('./emailWorker');

async function main() {
  try {
    await connectDB();
    await startEmailWorker();

    const shutdown = async (signal) => {
      try {
        console.log(`🛑 Stopping Email Worker (${signal})...`);
        await stopEmailWorker();
        await mongoose.disconnect();
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Email Bull Worker Runner failed:', err?.message || err);
    process.exit(1);
  }
}

main();
