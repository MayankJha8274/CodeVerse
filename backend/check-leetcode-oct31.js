require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  // Check LeetCode calendar
  const lc = await PlatformStats.findOne({ userId, platform: 'leetcode' });
  
  if (lc && lc.stats.submissionCalendar) {
    console.log('LeetCode calendar entries:', lc.stats.submissionCalendar.length);
    const oct31 = lc.stats.submissionCalendar.find(d => {
      const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
      return dateStr === '2025-10-31' || (dateStr && dateStr.includes('2025-10-31'));
    });
    
    if (oct31) {
      console.log('\nFound Oct 31 in LeetCode:',JSON.stringify(oct31));
      console.log('\nRemoving Oct 31 from LeetCode...');
      lc.stats.submissionCalendar = lc.stats.submissionCalendar.filter(d => {
        const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
        return dateStr !== '2025-10-31';
      });
      await lc.save();
      console.log('✅ Removed Oct 31 from LeetCode');
    } else {
      console.log('Oct 31 NOT in LeetCode calendar');
    }
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
