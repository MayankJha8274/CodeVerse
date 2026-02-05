const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');

/**
 * CP Rating Service
 * Tracks and analyzes competitive programming ratings across platforms
 */
/**
 * Track rating history over time
 * @param {string} userId - User ID
 * @param {string} platform - Platform name (leetcode, codeforces, codechef)
 * @param {number} days - Number of days to look back
 * @returns {Array} Rating history with timestamps
 */
const trackRatingHistory = async (userId, platform, days = 90) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const dailyProgress = await DailyProgress.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });

  const ratingHistory = dailyProgress
    .map(day => {
      const platformData = day.platformBreakdown?.find(p => p.platform === platform);
      if (platformData && platformData.rating > 0) {
        return {
          date: day.date,
          rating: platformData.rating
        };
      }
      return null;
    })
    .filter(entry => entry !== null);

  return ratingHistory;
};

/**
 * Detect rating changes compared to previous sync
 * @param {string} userId - User ID
 * @returns {Array} Array of rating changes for all platforms
 */
const detectRatingChanges = async (userId) => {
  const changes = [];
  const platforms = ['leetcode', 'codeforces', 'codechef'];

  for (const platform of platforms) {
    const currentStats = await PlatformStats.findOne({
      userId,
      platform,
      fetchStatus: 'success'
    });

    if (!currentStats || !currentStats.stats.rating) {
      continue;
    }

    // Get rating from 7 days ago
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const pastProgress = await DailyProgress.findOne({
      userId,
      date: { $lte: weekAgo }
    }).sort({ date: -1 });

    if (pastProgress) {
      const pastPlatformData = pastProgress.platformBreakdown?.find(p => p.platform === platform);
      const oldRating = pastPlatformData?.rating || 0;
      const newRating = currentStats.stats.rating;

      if (oldRating > 0 && oldRating !== newRating) {
        changes.push({
          platform,
          oldRating,
          newRating,
          change: newRating - oldRating,
          changePercent: Math.round(((newRating - oldRating) / oldRating) * 100)
        });
      }
    }
  }

  return changes;
};

/**
 * Predict next rating based on trend (simple linear extrapolation)
 * @param {string} userId - User ID
 * @param {string} platform - Platform name
 * @returns {Object} Prediction information
 */
const predictNextRating = async (userId, platform) => {
  const history = await trackRatingHistory(userId, platform, 90);

  if (history.length < 2) {
    return {
      predicted: null,
      confidence: 'low',
      message: 'Insufficient data for prediction'
    };
  }

  // Simple linear regression
  const n = history.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  history.forEach((point, index) => {
    const x = index;
    const y = point.rating;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Predict next point (index = n)
  const predicted = Math.round(slope * n + intercept);
  const currentRating = history[history.length - 1].rating;
  const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

  return {
    predicted,
    current: currentRating,
    expectedChange: predicted - currentRating,
    trend,
    confidence: history.length >= 10 ? 'high' : 'medium'
  };
};

/**
 * Analyze contest performance across all platforms
 * @param {string} userId - User ID
 * @returns {Object} Contest performance summary
 */
const analyzeContestPerformance = async (userId) => {
  const platforms = ['leetcode', 'codeforces', 'codechef'];
  const contestStats = {
    totalContests: 0,
    platformBreakdown: [],
    recentPerformance: []
  };

  for (const platform of platforms) {
    const stats = await PlatformStats.findOne({
      userId,
      platform,
      fetchStatus: 'success'
    });

    if (stats && stats.stats.contestsParticipated) {
      contestStats.totalContests += stats.stats.contestsParticipated;
      contestStats.platformBreakdown.push({
        platform,
        contests: stats.stats.contestsParticipated,
        rating: stats.stats.rating || 0,
        rank: stats.stats.rank || 'N/A'
      });
    }
  }

  // Get recent contest activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentProgress = await DailyProgress.find({
    userId,
    date: { $gte: thirtyDaysAgo }
  }).sort({ date: -1 });

  let contestsThisMonth = 0;
  recentProgress.forEach(day => {
    day.platformBreakdown?.forEach(p => {
      if (p.contests > 0) {
        contestsThisMonth++;
      }
    });
  });

  contestStats.recentPerformance = {
    contestsThisMonth,
    avgPerWeek: Math.round((contestsThisMonth / 30) * 7 * 10) / 10
  };

  return contestStats;
};

/**
 * Get rating rank and percentile across all platforms
 * @param {string} userId - User ID
 * @returns {Object} Ranking information
 */
const getRatingRank = async (userId) => {
  const platforms = ['leetcode', 'codeforces', 'codechef'];
  const rankings = [];

  for (const platform of platforms) {
    const userStats = await PlatformStats.findOne({
      userId,
      platform,
      fetchStatus: 'success'
    });

    if (userStats && userStats.stats.rating) {
      rankings.push({
        platform,
        rating: userStats.stats.rating,
        rank: userStats.stats.rank || 'N/A'
      });
    }
  }
  return rankings;
};

/**
 * Calculate highest rated platform
 * @param {string} userId - User ID
 * @returns {Object} Highest rated platform info
 */
const getHighestRatedPlatform = async (userId) => {
  const rankings = await getRatingRank(userId);
  
  if (rankings.length === 0) {
    return null;
  }

  return rankings.reduce((highest, current) => {
    return current.rating > (highest?.rating || 0) ? current : highest;
  }, null);
};

module.exports = {
  trackRatingHistory,
  detectRatingChanges,
  predictNextRating,
  analyzeContestPerformance,
  getRatingRank,
  getHighestRatedPlatform
};
