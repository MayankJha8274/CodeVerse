const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');
const User = require('../models/User');

/**
 * Insights Service
 * Provides intelligent insights, suggestions, and achievement tracking
 */

/**
 * Identify weak areas (platforms with low or no activity)
 * @param {string} userId - User ID
 * @returns {Array} List of underutilized platforms
 */
const identifyWeakAreas = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return [];
  }

  const weakAreas = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check all connected platforms
  for (const [platform, username] of Object.entries(user.platforms)) {
    if (!username) continue;

    const stats = await PlatformStats.findOne({
      userId,
      platform,
      fetchStatus: 'success'
    });

    // No stats or last fetched more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    if (!stats || stats.lastFetched < sevenDaysAgo) {
      weakAreas.push({
        platform,
        reason: 'inactive',
        message: `No recent activity on ${platform}`
      });
      continue;
    }

    // Check for low activity
    const recentProgress = await DailyProgress.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    });

    let platformActivity = 0;
    recentProgress.forEach(day => {
      const platformData = day.platformBreakdown?.find(p => p.platform === platform);
      if (platformData && (platformData.problemsSolved > 0 || platformData.commits > 0)) {
        platformActivity++;
      }
    });

    if (platformActivity < 5) { // Less than 5 active days in 30 days
      weakAreas.push({
        platform,
        reason: 'low_activity',
        message: `Only ${platformActivity} active days in last 30 days on ${platform}`,
        activeDays: platformActivity
      });
    }
  }

  return weakAreas;
};

/**
 * Suggest daily goals based on history and peer comparison
 * @param {string} userId - User ID
 * @returns {Object} Suggested goals
 */
const suggestDailyGoals = async (userId) => {
  // Get user's last 30 days activity
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentProgress = await DailyProgress.find({
    userId,
    date: { $gte: thirtyDaysAgo }
  });

  // Calculate average daily activity
  let totalProblems = 0;
  let totalCommits = 0;
  let activeDays = 0;

  recentProgress.forEach(day => {
    if (day.changes.problemsDelta > 0 || day.changes.commitsDelta > 0) {
      activeDays++;
      totalProblems += day.changes.problemsDelta;
      totalCommits += day.changes.commitsDelta;
    }
  });

  const avgProblems = activeDays > 0 ? Math.round(totalProblems / activeDays) : 0;
  const avgCommits = activeDays > 0 ? Math.round(totalCommits / activeDays) : 0;

  // Get global averages from all users
  const allUsersProgress = await DailyProgress.find({
    date: { $gte: thirtyDaysAgo }
  }).limit(1000);

  let globalProblems = 0;
  let globalCommits = 0;
  let globalActiveDays = 0;

  allUsersProgress.forEach(day => {
    if (day.changes.problemsDelta > 0 || day.changes.commitsDelta > 0) {
      globalActiveDays++;
      globalProblems += day.changes.problemsDelta;
      globalCommits += day.changes.commitsDelta;
    }
  });

  const globalAvgProblems = globalActiveDays > 0 ? Math.round(globalProblems / globalActiveDays) : 2;
  const globalAvgCommits = globalActiveDays > 0 ? Math.round(globalCommits / globalActiveDays) : 3;

  // Suggest slightly higher than user's average but not overwhelming
  const suggestedProblems = Math.max(
    Math.ceil(avgProblems * 1.2), // 20% increase
    Math.min(3, globalAvgProblems) // At least 3 or global average
  );

  const suggestedCommits = Math.max(
    Math.ceil(avgCommits * 1.2),
    Math.min(5, globalAvgCommits)
  );

  return {
    problemsToSolve: suggestedProblems,
    commitsToday: suggestedCommits,
    contestsThisWeek: 1,
    reasoning: {
      yourAverage: { problems: avgProblems, commits: avgCommits },
      globalAverage: { problems: globalAvgProblems, commits: globalAvgCommits },
      improvement: '20% increase over your average'
    }
  };
};

/**
 * Find similar users based on stats and activity
 * @param {string} userId - User ID
 * @param {number} limit - Number of similar users to return
 * @returns {Array} List of similar users
 */
const findSimilarUsers = async (userId, limit = 5) => {
  const user = await User.findById(userId);
  if (!user) {
    return [];
  }

  // Get user's total stats
  const userStats = await PlatformStats.find({
    userId,
    fetchStatus: 'success'
  });

  let userTotalProblems = 0;
  let userTotalCommits = 0;
  let userAvgRating = 0;
  let ratingCount = 0;

  userStats.forEach(stat => {
    userTotalProblems += stat.stats.problemsSolved || 0;
    userTotalCommits += stat.stats.totalCommits || 0;
    if (stat.stats.rating) {
      userAvgRating += stat.stats.rating;
      ratingCount++;
    }
  });

  userAvgRating = ratingCount > 0 ? userAvgRating / ratingCount : 0;

  // Find users with similar stats (±30% range)
  const allUsers = await User.find({
    _id: { $ne: userId },
    isActive: true
  }).limit(100);

  const similarUsers = [];

  for (const otherUser of allUsers) {
    const otherStats = await PlatformStats.find({
      userId: otherUser._id,
      fetchStatus: 'success'
    });

    let otherProblems = 0;
    let otherCommits = 0;
    let otherRating = 0;
    let otherRatingCount = 0;

    otherStats.forEach(stat => {
      otherProblems += stat.stats.problemsSolved || 0;
      otherCommits += stat.stats.totalCommits || 0;
      if (stat.stats.rating) {
        otherRating += stat.stats.rating;
        otherRatingCount++;
      }
    });

    otherRating = otherRatingCount > 0 ? otherRating / otherRatingCount : 0;

    // Calculate similarity score
    const problemDiff = Math.abs(userTotalProblems - otherProblems);
    const commitDiff = Math.abs(userTotalCommits - otherCommits);
    const ratingDiff = Math.abs(userAvgRating - otherRating);

    const similarityScore = 100 - (
      (problemDiff / (userTotalProblems || 1)) * 30 +
      (commitDiff / (userTotalCommits || 1)) * 30 +
      (ratingDiff / (userAvgRating || 1000)) * 40
    );

    if (similarityScore > 70) { // 70% or more similar
      similarUsers.push({
        userId: otherUser._id,
        username: otherUser.username,
        email: otherUser.email,
        similarityScore: Math.round(similarityScore),
        stats: {
          problems: otherProblems,
          commits: otherCommits,
          rating: Math.round(otherRating)
        }
      });
    }
  }

  // Sort by similarity and return top N
  return similarUsers
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);
};

/**
 * Detect achievements and milestones
 * @param {string} userId - User ID
 * @returns {Array} List of recent achievements
 */
const detectAchievements = async (userId) => {
  const achievements = [];

  // Get user's current stats
  const stats = await PlatformStats.find({
    userId,
    fetchStatus: 'success'
  });

  let totalProblems = 0;
  let totalCommits = 0;
  let totalContests = 0;
  let platformsConnected = stats.length;

  stats.forEach(stat => {
    totalProblems += stat.stats.problemsSolved || 0;
    totalCommits += stat.stats.totalCommits || 0;
    totalContests += stat.stats.contestsParticipated || 0;
  });

  // Problem milestones
  const problemMilestones = [10, 50, 100, 250, 500, 1000, 2000, 5000];
  problemMilestones.forEach(milestone => {
    if (totalProblems >= milestone && totalProblems < milestone + 50) {
      achievements.push({
        type: 'problems',
        title: `${milestone} Problems Solved! 🎯`,
        description: `You've solved ${totalProblems} problems across all platforms`,
        milestone,
        current: totalProblems,
        badge: '🏆'
      });
    }
  });

  // Commit milestones
  const commitMilestones = [50, 100, 500, 1000, 2000, 5000, 10000];
  commitMilestones.forEach(milestone => {
    if (totalCommits >= milestone && totalCommits < milestone + 100) {
      achievements.push({
        type: 'commits',
        title: `${milestone} Commits! 💻`,
        description: `You've made ${totalCommits} commits on GitHub`,
        milestone,
        current: totalCommits,
        badge: '🚀'
      });
    }
  });

  // Contest milestones
  const contestMilestones = [5, 10, 25, 50, 100];
  contestMilestones.forEach(milestone => {
    if (totalContests >= milestone && totalContests < milestone + 10) {
      achievements.push({
        type: 'contests',
        title: `${milestone} Contests Participated! 🏅`,
        description: `You've participated in ${totalContests} contests`,
        milestone,
        current: totalContests,
        badge: '⚔️'
      });
    }
  });

  // Platform connection achievement
  if (platformsConnected >= 5) {
    achievements.push({
      type: 'platforms',
      title: 'Multi-Platform Master! 🌟',
      description: `Connected to ${platformsConnected} platforms`,
      badge: '🌐'
    });
  }

  // Streak achievements
  const { calculateStreaks } = require('./aggregationService');
  const streaks = await calculateStreaks(userId);

  if (streaks.currentStreak >= 7) {
    achievements.push({
      type: 'streak',
      title: `${streaks.currentStreak}-Day Streak! 🔥`,
      description: `You've been active for ${streaks.currentStreak} consecutive days`,
      badge: '🔥'
    });
  }

  if (streaks.longestStreak >= 30) {
    achievements.push({
      type: 'streak',
      title: 'Consistency King! 👑',
      description: `Longest streak: ${streaks.longestStreak} days`,
      badge: '👑'
    });
  }

  return achievements;
};

/**
 * Generate personalized insights summary
 * @param {string} userId - User ID
 * @returns {Object} Complete insights summary
 */
const generateInsightsSummary = async (userId) => {
  const [weakAreas, goals, achievements, similarUsers] = await Promise.all([
    identifyWeakAreas(userId),
    suggestDailyGoals(userId),
    detectAchievements(userId),
    findSimilarUsers(userId, 3)
  ]);

  return {
    weakAreas,
    suggestedGoals: goals,
    recentAchievements: achievements,
    similarUsers,
    generatedAt: new Date()
  };
};

module.exports = {
  identifyWeakAreas,
  suggestDailyGoals,
  findSimilarUsers,
  detectAchievements,
  generateInsightsSummary
};
