require('dotenv').config();
const mongoose = require('mongoose');
const PlatformStats = require('./src/models/PlatformStats');
const DailyProgress = require('./src/models/DailyProgress');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const userId = '697774b9d8d704296dd261e2';
  
  console.log('=== Clearing ALL calendar and progress data ===\n');
  
  // Clear all platform calendars
  const platforms = await PlatformStats.find({ userId });
  for (const platform of platforms) {
    if (platform.stats.submissionCalendar && platform.stats.submissionCalendar.length > 0) {
      console.log(`Clearing ${platform.platform}: ${platform.stats.submissionCalendar.length} entries`);
      platform.stats.submissionCalendar = [];
      await platform.save();
    }
  }
  
  // Clear DailyProgress (this stores manual/aggregated progress)
  const dailyProgressCount = await DailyProgress.countDocuments({ userId });
  if (dailyProgressCount > 0) {
    console.log(`\nClearing DailyProgress: ${dailyProgressCount} entries`);
    await DailyProgress.deleteMany({ userId });
  }
  
  console.log('\n✅ All calendar data cleared!');
  console.log('📝 Next: Sync all platforms to fetch fresh data');
  
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
