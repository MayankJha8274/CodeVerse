require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const ContestReminder = require('./src/models/ContestReminder');
const User = require('./src/models/User');
const Contest = require('./src/models/Contest');

async function runTest() {
  await connectDB();
  const user = new User({ 
    fullName: 'TestUser', 
    email: 'test-' + Date.now() + '@example.com', 
    password: 'password123',
    username: 'test-' + Date.now(), 
    settings: { emailNotifications: true, notifyContests: true } 
  });
  await user.save();
  
  const contest = new Contest({ 
    platform: 'leetcode', 
    contestId: 'contest-' + Date.now(),
    name: 'Test Contest', 
    startTime: new Date(Date.now() + 3600000), 
    endTime: new Date(Date.now() + 7200000), 
    url: 'href' 
  });
  await contest.save();
  
  const rem = new ContestReminder({ 
    userId: user._id, 
    contestId: contest._id, 
    reminderSent: false, 
    email: user.email, 
    reminderTime: new Date(Date.now() - 60000)
  });
  await rem.save();
  
  console.log('✅ Test reminder injected into MongoDB!');
  process.exit(0);
}
runTest();