const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const { fetchGeeksforGeeksStats } = require('./src/services/platforms/geeksforgeeksService');
    
    console.log('Fetching GFG stats with topic extraction...\n');
    const result = await fetchGeeksforGeeksStats('mayankjha8274');
    
    if (result.success) {
      console.log('\n=== GFG Result ===');
      console.log('Problems:', result.stats.problemsSolved);
      console.log('Difficulty:', `E:${result.stats.easySolved} M:${result.stats.mediumSolved} H:${result.stats.hardSolved}`);
      console.log('Topics:', result.stats.topics?.length || 0);
      if (result.stats.topics && result.stats.topics.length > 0) {
        console.log('\nTopic breakdown:');
        result.stats.topics.forEach(t => console.log(`  ${t.name}: ${t.count}`));
        
        // Also update the DB
        const PlatformStats = require('./src/models/PlatformStats');
        const User = require('./src/models/User');
        const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
        
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform: 'geeksforgeeks' },
          { 'stats.topics': result.stats.topics },
          { new: true }
        );
        console.log('\n✅ GFG topics updated in DB!');
        
        // Verify
        const updated = await PlatformStats.findOne({ userId: user._id, platform: 'geeksforgeeks' });
        console.log('DB topics count:', updated.stats.topics?.length || 0);
      }
    } else {
      console.log('Failed:', result.error);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
