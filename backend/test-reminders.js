require('dotenv').config();
const mongoose = require('mongoose');
const Contest = require('./src/models/Contest');
const User = require('./src/models/User');
const NotificationLog = require('./src/models/NotificationLog');
const { processContestReminders } = require('./src/services/cronService');
const { initEmailQueue } = require('./src/queues/emailQueue');

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('Fetching a user to test with...');
  const user = await User.findOne({ email: { $exists: true } });
  if (user) {
      console.log('Testing with user:', user.email);
      user.settings = user.settings || {};
      user.settings.emailNotifications = true;
      user.notifyContests = true;
      user.isVerified = true;
      await user.save();
  } else {
      console.log('No user found! Please register first.');
      process.exit(1);
  }

  console.log('Creating a mock contest starting in exactly 23.9 hours...');
  await Contest.deleteMany({ name: 'Test Contest Reminders 101' });
  const mockContest = await Contest.create({
      name: 'Test Contest Reminders 101',
      platform: 'leetcode',
      contestId: 'test_contest_101',
      url: 'https://leetcode.com/contest/test',
      startTime: new Date(Date.now() + (23.9 * 60 * 60 * 1000)),
      endTime: new Date(Date.now() + (25.9 * 60 * 60 * 1000)),
      duration: 120
  });

  console.log('Clearing NotificationLog for this contest...');
  await NotificationLog.deleteMany({ contestId: mockContest._id });

  console.log('Initializing Queue...');
  await initEmailQueue();

  console.log('Running processContestReminders()...');
  await processContestReminders();

  setTimeout(() => {
      console.log('Done script dispatching. Worker will pick it up.');
      process.exit(0);
  }, 3000);
}

runTest().catch(console.error);
