require('dotenv').config();
const mongoose = require('mongoose');

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

async function resetUserData() {
  try {
    console.log('🔥 Starting database reset...');
    
    // Import models
    const PlatformStats = require('./src/models/PlatformStats');
    const DailyProgress = require('./src/models/DailyProgress');
    const User = require('./src/models/User');
    
    // Find the specific user (mayank Jha or by email)
    const user = await User.findOne({ email: 'mayankjha8274@gmail.com' });
    
    if (!user) {
      console.error('❌ User not found with that email');
      process.exit(1);
    }
    
    console.log(`\n📌 Resetting data for user: ${user.username} (${user.email})`);
    
    // Delete all platform stats for this user
    const deletedStats = await PlatformStats.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${deletedStats.deletedCount} platform stats`);
    
    // Delete all daily progress for this user
    const deletedProgress = await DailyProgress.deleteMany({ userId: user._id });
    console.log(`✅ Deleted ${deletedProgress.deletedCount} daily progress records`);
    
    console.log('✅ Database reset complete!');
    console.log('');
    console.log('🚀 NOW: Go to your dashboard and click "Sync All Platforms"');
    console.log('   This will fetch fresh data from all platforms and rebuild everything correctly.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetUserData();
