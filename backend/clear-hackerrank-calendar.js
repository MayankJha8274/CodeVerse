require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  // Clear HackerRank calendar to re-fetch fresh
  const hr = await PlatformStats.findOne({ userId, platform: 'hackerrank' });
  if (hr && hr.stats.submissionCalendar) {
    console.log(`HackerRank has ${hr.stats.submissionCalendar.length} calendar entries`);
    console.log('Clearing HackerRank calendar to force re-fetch...');
    hr.stats.submissionCalendar = [];
    await hr.save();
    console.log('✅ Cleared. Please re-sync HackerRank to get fresh data.');
  } else {
    console.log('No HackerRank calendar found');
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
