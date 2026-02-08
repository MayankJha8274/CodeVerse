require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  // Find all platforms with calendar data
  const allPlatforms = await PlatformStats.find({ userId });
  
  console.log('=== Checking all platforms for calendar data ===\n');
  
  for (const platform of allPlatforms) {
    if (platform.stats.submissionCalendar && platform.stats.submissionCalendar.length > 0) {
      console.log(`${platform.platform}: ${platform.stats.submissionCalendar.length} calendar entries`);
      
      // For GFG, CodeChef, CodingNinjas - clear the fake estimated calendar
      if (['geeksforgeeks', 'codechef', 'codingninjas'].includes(platform.platform)) {
        console.log(`  ❌ Clearing fake estimated calendar for ${platform.platform}`);
        platform.stats.submissionCalendar = [];
        await platform.save();
        console.log(`  ✅ Cleared ${platform.platform} calendar\n`);
      } else {
        console.log(`  ✓ Keeping real calendar data for ${platform.platform}\n`);
      }
    } else {
      console.log(`${platform.platform}: No calendar data\n`);
    }
  }
  
  console.log('=== Done ===');
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
