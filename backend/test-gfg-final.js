const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Run the actual GFG service
    const { fetchGeeksforGeeksStats } = require('./src/services/platforms/geeksforgeeksService');
    
    console.log('Running GFG service with topic extraction...\n');
    const result = await fetchGeeksforGeeksStats('mayankjha8274');
    
    if (result.success) {
      console.log('\n=== GFG Result ===');
      console.log('Problems:', result.stats.problemsSolved);
      console.log('Difficulty:', `E:${result.stats.easySolved} M:${result.stats.mediumSolved} H:${result.stats.hardSolved}`);
      console.log('Topics:', result.stats.topics?.length || 0);
      if (result.stats.topics && result.stats.topics.length > 0) {
        console.log('\nTopic breakdown:');
        result.stats.topics.forEach(t => console.log(`  ${t.name}: ${t.count}`));
        
        // Update DB
        const PlatformStats = require('./src/models/PlatformStats');
        const User = require('./src/models/User');
        const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
        
        await PlatformStats.findOneAndUpdate(
          { userId: user._id, platform: 'geeksforgeeks' },
          { 'stats.topics': result.stats.topics },
          { new: true }
        );
        console.log('\n✅ GFG topics updated in DB!');
      } else {
        console.log('No topics extracted. Checking if submissions data available...');
      }
    } else {
      console.log('Failed:', result.error);
    }
    
    // Verify DB state
    const PlatformStats = require('./src/models/PlatformStats');
    const User = require('./src/models/User');
    const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
    const stats = await PlatformStats.find({ userId: user._id });
    
    console.log('\n=== Current DB Topic State ===');
    for (const s of stats) {
      const topicCount = s.stats?.topics?.length || 0;
      if (topicCount > 0) {
        console.log(`${s.platform}: ${topicCount} topics`);
        s.stats.topics.slice(0, 5).forEach(t => console.log(`  ${t.name}: ${t.count}`));
      } else {
        console.log(`${s.platform}: 0 topics`);
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
