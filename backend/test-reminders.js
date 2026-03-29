require('dotenv').config();
const mongoose = require('mongoose');
const Contest = require('./src/models/Contest');
const User = require('./src/models/User');
const NotificationLog = require('./src/models/NotificationLog');
const { processContestReminders } = require('./src/services/cronService');
const { emailQueue } = require('./src/queues/emailQueue');
const { startEmailWorker } = require('./src/workers/emailWorker');
async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('Fetching a user to test with...');
  const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
  if (user) {
      console.log('Testing with user:', user.email);
      user.settings = user.settings || {};
      user.settings.emailNotifications = true;
      user.settings.notifyContests = true;
      user.isVerified = true;
      user.lastActivityAt = new Date();
      user.contestCount = 5;
      user.lastNotifiedAt = null;
      await user.save();
  } else {
      console.log('No user mayankjha8274@gmail.com found! Defaulting to any user...');
      const fallbackUser = await User.findOne({ email: { $exists: true } });
      if(fallbackUser) {
        console.log('Testing with fallback user:', fallbackUser.email);
        fallbackUser.settings = fallbackUser.settings || {};
        fallbackUser.settings.emailNotifications = true;
        fallbackUser.settings.notifyContests = true;
        fallbackUser.isVerified = true;
        await fallbackUser.save();
      } else {
        console.log('No user found! Please register first.');
        process.exit(1);
      }
  }

  console.log('Creating a mock contest starting in exactly 60.5 minutes...');
  await Contest.deleteMany({ name: 'Test Contest Reminders 101' });
  const mockContest = await Contest.create({
      name: 'Test Contest Reminders 101',
      platform: 'leetcode',
      contestId: 'test_contest_101',
      url: 'https://leetcode.com/contest/weekly-contest-389/',
      startTime: new Date(Date.now() + (60.5 * 60 * 1000)),
      endTime: new Date(Date.now() + (120.5 * 60 * 1000)),
      duration: 120
  });

  console.log('Clearing NotificationLog for this contest...');
  await NotificationLog.deleteMany({ contestId: mockContest._id });

  console.log('Initializing Queue...');
  await startEmailWorker();

  console.log('Running processContestReminders()...');
  await processContestReminders();

  setTimeout(() => {
      console.log('Done script dispatching. Worker processed the queue! You can check your inbox.');
      process.exit(0);
  }, 10000); // 10 seconds to allow nodemailer to send
}

runTest().catch(console.error);
