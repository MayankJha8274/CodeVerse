require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { addSyncJob } = require('../src/queues/syncQueue');
const { getRedisConnection } = require('../src/config/redis');

async function testSyncFlow() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Ensure Redis initializes
    console.log('🔄 Connecting to Redis...');
    getRedisConnection();

    // Give redis a second to connect
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('🔍 Finding a test user...');
    let user = await User.findOne({});
    
    if (!user) {
      console.log('⚠️ No users found in DB. Creating a dummy test user...');
      user = await User.create({
        username: 'test_sync_user',
        email: 'testsync@codeverse.com',
        password: 'password123',
        fullName: 'Test Sync User',
        platforms: {
          github: 'torvalds', // Linus Torvalds for valid github stats
          leetcode: 'saurabh'
        },
        isActive: true
      });
    }

    console.log(`✅ Found user: ${user.username} (${user._id})`);
    console.log('📥 Pushing High Priority Sync Job to Queue...');

    const job = await addSyncJob(user._id, {
      triggeredBy: 'e2e_test_script',
      hardReset: true, // Bypass cache
      priority: 1
    });

    if (job) {
      console.log(`✅ Job successfully added! Job ID: ${job.id}`);
      console.log('--> Open your running `npm run dev` terminal to watch the worker pick it up!');
      console.log('--> Or check Bull Board here: http://localhost:5000/admin/queues');
    } else {
      console.log('❌ Failed to add job. Queue might not be initialized or Redis is offline.');
    }

  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testSyncFlow();