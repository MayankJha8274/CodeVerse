const mongoose = require('mongoose');

const dailyProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Aggregated stats from all platforms
  aggregatedStats: {
    totalProblemsSolved: { type: Number, default: 0 },
    totalCommits: { type: Number, default: 0 },
    totalContests: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    platformsActive: { type: Number, default: 0 }
  },
  // Platform-wise breakdown
  platformBreakdown: [{
    platform: {
      type: String,
      enum: ['leetcode', 'github', 'codeforces', 'codechef', 'geeksforgeeks', 'hackerrank', 'codingninjas']
    },
    problemsSolved: { type: Number, default: 0 },
    commits: { type: Number, default: 0 },
    contestsParticipated: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }
  }],
  // Daily changes (delta from previous day)
  changes: {
    problemsDelta: { type: Number, default: 0 },
    commitsDelta: { type: Number, default: 0 },
    ratingDelta: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound index for unique daily records per user
dailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyProgress', dailyProgressSchema);
