require('dotenv').config({ path: require('path').join(__dirname, './.env') });
const mongoose = require('mongoose');
const path = require('path');
const User = require('./src/models/User');
const Contest = require('./src/models/Contest');
const ContestReminder = require('./src/models/ContestReminder');

const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/codeverse-test';

async function main() {
  try {
    await mongoose.connect(MONGO);
    console.log('✅ Connected to MongoDB');

    // Create test contest
    const contest = await Contest.create({
      name: 'Test Mass Reminder Contest',
      platform: 'leetcode',
      url: 'https://example.com/contest/test-mass-reminder',
      startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      duration: 60,
      contestId: `test-${Date.now()}`
    });

    console.log('🟢 Created test contest:', contest._id.toString());

    const created = [];

    for (let i = 1; i <= 100; i++) {
      const username = `testuser_${Date.now()}_${i}`;
      const email = `testuser_${Date.now()}_${i}@example.com`;

      const user = new User({
        username,
        email,
        password: 'password123',
        fullName: `Test User ${i}`
      });

      await user.save();

      const reminderTime = new Date(Date.now() - 1000); // in the past so cron picks it up immediately

      const reminder = new ContestReminder({
        userId: user._id,
        contestId: contest._id,
        email: user.email,
        reminderTime,
        contestDetails: {
          name: contest.name,
          platform: contest.platform,
          url: contest.url,
          startTime: contest.startTime,
          duration: contest.duration
        }
      });

      await reminder.save();
      created.push({ user: user._id.toString(), reminder: reminder._id.toString(), email: user.email });

      if (i % 10 === 0) console.log(`Created ${i} users/reminders...`);
    }

    console.log('✅ Finished creating 100 users and reminders');
    console.log('Sample created items:', created.slice(0, 3));

    await mongoose.disconnect();
    console.log('🛑 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during test creation:', err);
    process.exit(1);
  }
}

main();
