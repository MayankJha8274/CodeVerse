require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  console.log('=== Removing Oct 31, 2025 from HackerRank calendar ===\n');
  
  const hr = await PlatformStats.findOne({ userId, platform: 'hackerrank' });
  
  if (hr && hr.stats.submissionCalendar) {
    const before = hr.stats.submissionCalendar.length;
    console.log(`Before: ${before} calendar entries`);
    
    // Remove Oct 31
    hr.stats.submissionCalendar = hr.stats.submissionCalendar.filter(d => {
      const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
      return dateStr !== '2025-10-31';
    });
    
    await hr.save();
    
    const after = hr.stats.submissionCalendar.length;
    console.log(`After: ${after} calendar entries`);
    console.log(`Removed: ${before - after} entry`);
    console.log('\n✅ Oct 31, 2025 removed from HackerRank calendar');
    console.log('Refresh your dashboard to see updated streaks');
  } else {
    console.log('No HackerRank calendar found');
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
