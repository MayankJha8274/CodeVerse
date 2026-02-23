const mongoose = require('mongoose');

const platformStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['leetcode', 'github', 'codeforces', 'codechef', 'geeksforgeeks', 'hackerrank', 'codingninjas'],
    required: true
  },
  stats: {
    // LeetCode specific
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 },
    ranking: { type: Number, default: 0 },
    
    // Competitive Programming (Codeforces, CodeChef)
    rating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    contestsParticipated: { type: Number, default: 0 },
    globalRank: { type: Number, default: 0 },
    countryRank: { type: Number, default: 0 },
    
    // GitHub specific
    totalCommits: { type: Number, default: 0 },
    totalRepos: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },
    totalPRs: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },
    totalContributions: { type: Number, default: 0 }, // Total of all contribution types
    allTimeContributions: { type: Number, default: 0 }, // Same as totalContributions
    currentYearContributions: { type: Number, default: 0 },
    contributionStreak: { type: Number, default: 0 },
    
    // General
    problemsSolved: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    score: { type: Number, default: 0 },

    // Calendar/heatmap data (arrays of {date, count})
    submissionCalendar: { type: mongoose.Schema.Types.Mixed, default: null },
    contributionCalendar: { type: mongoose.Schema.Types.Mixed, default: null },
    leetcodeStreak: { type: Number, default: 0 },
    leetcodeActiveDays: { type: Number, default: 0 },
    
    // Cached data to avoid external API calls on every page load
    topics: { type: [{ name: String, count: Number }], default: [] },
    badges: { type: [{ name: String, icon: String, earnedDate: Date }], default: [] }
  },
  // Store daily data for trend analysis
  history: [{
    date: { type: Date, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed }
  }],
  lastFetched: {
    type: Date,
    default: Date.now
  },
  fetchStatus: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for faster queries --> Compound index = fast search using multiple fields together
platformStatsSchema.index({ userId: 1, platform: 1 }, { unique: true });
platformStatsSchema.index({ lastFetched: 1 });

module.exports = mongoose.model('PlatformStats', platformStatsSchema);
