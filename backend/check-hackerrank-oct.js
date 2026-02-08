require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  // Get HackerRank stats
  const hr = await PlatformStats.findOne({ userId, platform: 'hackerrank' });
  
  if (hr && hr.stats.submissionCalendar) {
    console.log('HackerRank problemsSolved:', hr.stats.problemsSolved);
    console.log('HackerRank calendar entries:', hr.stats.submissionCalendar.length);
    console.log('\nOct 2025 entries:');
    const oct2025 = hr.stats.submissionCalendar.filter(d => d.date && d.date.includes('2025-10'));
    oct2025.forEach(d => console.log(`  ${d.date}: ${d.count}`));
    
    console.log('\nCHECK YOUR HACKERRANK PROFILE:');
    console.log('Go to: https://www.hackerrank.com/mayankjha8274');
    console.log('Check if you truly have submissions on Oct 31, 2025');
    console.log('\nIf HackerRank API is wrong, we need to manually correct it or ignore that date.');
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
