require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  // Find all platforms with calendar data
  const allPlatforms = await PlatformStats.find({ userId });
  
  console.log('=== Checking Oct 31, 2025 across all platforms ===\n');
  
  for (const platform of allPlatforms) {
    if (platform.stats.submissionCalendar && platform.stats.submissionCalendar.length > 0) {
      const oct31 = platform.stats.submissionCalendar.find(d => {
        const dateStr = d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date;
        return dateStr === '2025-10-31' || (dateStr && dateStr.includes('2025-10-31'));
      });
      
      if (oct31) {
        console.log(`${platform.platform}: Oct 31 has ${oct31.count} submissions`);
        console.log(`  Full entry:`, JSON.stringify(oct31));
      } else {
        console.log(`${platform.platform}: No Oct 31 data`);
      }
    } else {
      console.log(`${platform.platform}: No calendar data`);
    }
  }
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
