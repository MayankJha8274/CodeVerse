const mongoose = require('mongoose');
const SocietyMember = require('../models/SocietyMember');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');
const SocietyStreak = require('../models/SocietyStreak');
const UserBadge = require('../models/UserBadge');
const { calculateCodingScore } = require('./leaderboardController');

// @desc    Get society leaderboard (live)
// @route   GET /api/societies/:societyId/leaderboard
// @access  Private (member)
const getLeaderboard = async (req, res, next) => {
  try {
    const { period = 'alltime', page = 1, limit = 50 } = req.query;
    const { societyId } = req.params;

    // Weight configuration
    const WEIGHTS = {
      problemsSolved: 3,
      contestScore: 4,
      chatContribution: 1,
      eventParticipation: 2,
      helpfulness: 2,
      consistency: 3
    };

    // Get all active members
    const membersRaw = await SocietyMember.find({ society: societyId, isBanned: false, isActive: true })
      .populate('user', 'username fullName avatar platforms')
      .lean();

    // Filter out members whose user was deleted (populate returns null)
    const members = membersRaw.filter(m => m.user != null);

    // Get platform stats for all members
    const userIds = members.map(m => m.user._id || m.user);
    const platformStats = await PlatformStats.find({ userId: { $in: userIds } }).lean();
    const streaks = await SocietyStreak.find({ society: societyId, user: { $in: userIds } }).lean();

    // Calculate date range based on period
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Normalize to local midnight to match DailyProgress timestamps

    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setDate(startDate.getDate() - 30); // Precise 30-day offset
        break;
      case 'yearly':
        startDate.setDate(startDate.getDate() - 365); // Precise 365-day offset
        break;
      case 'alltime':
      default:
        startDate = new Date(0); // Beginning of time
        break;
    }

    const isAllTime = period === 'alltime' || !period;

    // Get daily progress in date range for delta calculations
    const dailyProgress = isAllTime ? [] : await DailyProgress.find({
      userId: { $in: userIds },
      date: { $gte: startDate }
    }).lean();

    // Find the baseline record strictly BEFORE the start date for each user
    const baselineRecords = isAllTime ? [] : await DailyProgress.aggregate([
      { $match: { userId: { $in: [...userIds.map(id => new mongoose.Types.ObjectId(id.toString())), ...userIds.map(id => id.toString())] }, date: { $lt: startDate } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } }
    ]);

    const firstRecordsMap = {};
    dailyProgress.forEach(dp => {
      const uid = dp.userId.toString();
      if (!firstRecordsMap[uid] || new Date(dp.date) < new Date(firstRecordsMap[uid].date)) {
        firstRecordsMap[uid] = dp;
      }
    });

    const baselineMap = {};
    baselineRecords.forEach(b => {
      baselineMap[b._id.toString()] = b.doc;
    });

    const statsMap = {};
    platformStats.forEach(ps => {
      const uid = ps.userId.toString();
      if (!statsMap[uid]) statsMap[uid] = {
        totalSolved: 0,
        contestRating: 0,
        maxRating: 0,
        totalCommits: 0,
        totalContributions: 0,
        totalSubmissions: 0,
        contestsParticipated: 0,
        platforms: {},
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0
      };
      const s = statsMap[uid];
      s.totalSolved += (ps.stats?.totalSolved || ps.stats?.problemsSolved || 0);
      s.easySolved += (ps.stats?.easySolved || 0);
      s.mediumSolved += (ps.stats?.mediumSolved || 0);
      s.hardSolved += (ps.stats?.hardSolved || 0);
      s.contestRating = Math.max(s.contestRating, ps.stats?.rating || 0);
      s.maxRating = Math.max(s.maxRating, ps.stats?.maxRating || ps.stats?.rating || 0);
      s.totalCommits += (ps.stats?.totalCommits || 0);
      s.totalContributions += (ps.stats?.totalContributions || 0);
      s.totalSubmissions += (ps.stats?.submissions || 0);
      s.contestsParticipated += (ps.stats?.contestsParticipated || 0);
      s.platforms[ps.platform] = {
        solved: ps.stats?.totalSolved || ps.stats?.problemsSolved || 0,
        rating: ps.stats?.rating || 0,
        submissions: ps.stats?.submissions || 0,
        commits: ps.stats?.totalCommits || 0,
        contributions: ps.stats?.totalContributions || 0
      };
    });

    const streakMap = {};
    streaks.forEach(s => { streakMap[s.user.toString()] = s; });

    // Calculate scores
    let rankings = members.map(m => {
      const uid = (m.user._id || m.user).toString();
      const ps = statsMap[uid] || { totalSolved: 0, contestRating: 0, maxRating: 0, totalCommits: 0, totalContributions: 0, totalSubmissions: 0, contestsParticipated: 0, platforms: {}, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
      const streak = streakMap[uid] || { currentStreak: 0, totalActiveDays: 0 };

      // Build stats object that matches what calculateCodingScore expects
      const leetcode = platformStats.find(s => s.userId.toString() === uid && s.platform === 'leetcode') || { stats: {} };
      const github = platformStats.find(s => s.userId.toString() === uid && s.platform === 'github') || { stats: {} };
      const codeforces = platformStats.find(s => s.userId.toString() === uid && s.platform === 'codeforces') || { stats: {} };
      const codechef = platformStats.find(s => s.userId.toString() === uid && s.platform === 'codechef') || { stats: {} };

      const startingDp = baselineMap[uid] || firstRecordsMap[uid];
      const problemsDelta = startingDp?.aggregatedStats 
        ? Math.max(0, ps.totalSolved - (startingDp.aggregatedStats.totalProblemsSolved || 0)) 
        : (isAllTime ? ps.totalSolved : 0); // fallback to 0 if NO history exists
      const commitsDelta = startingDp?.aggregatedStats 
        ? Math.max(0, ps.totalCommits - (startingDp.aggregatedStats.totalCommits || 0)) 
        : (isAllTime ? ps.totalCommits : 0);
      
      const statsForCodingScore = {
        totalProblems: isAllTime ? ps.totalSolved : problemsDelta,
        leetcode,
        codeforces,
        codechef,
        github: {
          ...github,
          stats: {
             ...github.stats,
             totalContributions: isAllTime ? (github.stats?.totalContributions || 0) : 
                (commitsDelta + (github.stats?.totalContributions || 0) - (github.stats?.totalCommits || 0)) 
                // We map commitsDelta correctly. To keep it simple: just pass commitsDelta
                // Github scoring relies on totalContributions, so let's pass our commitsDelta 
                // since they were previously passing commitsDelta directly into totalContributions
          }
        }
      };
      
      // Override totalContributions with commitsDelta for legacy compat with codingScore
      if (!isAllTime && statsForCodingScore.github.stats) {
          statsForCodingScore.github.stats.totalContributions = commitsDelta;
      }

      const codingScore = calculateCodingScore(m.user, statsForCodingScore);

      // Current rating: best current rating across platforms
      const currentRating = ps.contestRating || 0;

      const breakdown = {
        problemsSolved: isAllTime ? ps.totalSolved : problemsDelta,
        contestScore: Math.floor(ps.contestRating / 10),
        chatContribution: m.messagesCount || 0,
        eventParticipation: m.eventsAttended || 0,
        helpfulness: m.helpfulnessScore || 0,
        consistency: streak.totalActiveDays || 0
      };

      const score = codingScore;

      return {
        user: m.user,
        role: m.role,
        score,
        codingScore,
        breakdown,
        codingProfile: {
          totalSolved: isAllTime ? ps.totalSolved : problemsDelta,
          easySolved: ps.easySolved,
          mediumSolved: ps.mediumSolved,
          hardSolved: ps.hardSolved,
          contestRating: ps.contestRating,
          currentRating,
          maxRating: ps.maxRating,
          totalCommits: isAllTime ? ps.totalCommits : commitsDelta,
          totalContributions: isAllTime ? ps.totalContributions : commitsDelta,
          totalSubmissions: ps.totalSubmissions,
          contestsParticipated: ps.contestsParticipated,
          platforms: ps.platforms
        },
        currentStreak: streak.currentStreak || 0,
        joinedAt: m.createdAt
      };
    });

    // Sort by score descending
    rankings.sort((a, b) => b.score - a.score);

    // Add ranks
    rankings.forEach((r, i) => { r.rank = i + 1; });

    // Find current user's rank
    const currentUserRank = rankings.find(r =>
      (r.user._id || r.user).toString() === req.user.id
    );

    // Paginate
    const total = rankings.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    rankings = rankings.slice(skip, skip + parseInt(limit));

    // Calculate percentile
    rankings.forEach(r => {
      r.percentile = total > 1 ? Math.round(((total - r.rank) / (total - 1)) * 100) : 100;
    });

    res.status(200).json({
      success: true,
      data: {
        rankings,
        currentUser: currentUserRank ? {
          rank: currentUserRank.rank,
          score: currentUserRank.score,
          codingScore: currentUserRank.codingScore,
          codingProfile: currentUserRank.codingProfile,
          totalProblems: currentUserRank.codingProfile?.totalSolved || 0,
          percentile: total > 1 ? Math.round(((total - currentUserRank.rank) / (total - 1)) * 100) : 100
        } : null,
        totalParticipants: total,
        weights: WEIGHTS
      },
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leaderboard history/snapshot
// @route   GET /api/societies/:societyId/leaderboard/history
// @access  Private (member)
const getLeaderboardHistory = async (req, res, next) => {
  try {
    const { period = 'weekly', days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const snapshots = await LeaderboardSnapshot.find({
      society: req.params.societyId,
      period,
      date: { $gte: since }
    })
      .sort({ date: 1 })
      .lean();

    // Extract current user's rank history
    const userHistory = snapshots.map(s => {
      const userRank = s.rankings?.find(r => r.user?.toString() === req.user.id);
      return {
        date: s.date,
        rank: userRank?.rank || null,
        score: userRank?.score || 0,
        totalParticipants: s.totalParticipants
      };
    });

    res.status(200).json({
      success: true,
      data: { snapshots: snapshots.length, userHistory }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's badges in a society
// @route   GET /api/societies/:societyId/badges
// @access  Private (member)
const getUserBadges = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const targetUser = userId || req.user.id;

    const badges = await UserBadge.find({
      user: targetUser,
      $or: [{ society: req.params.societyId }, { society: null }]
    })
      .populate('badge')
      .sort({ awardedAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: badges });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's streak in a society
// @route   GET /api/societies/:societyId/streak
// @access  Private (member)
const getUserStreak = async (req, res, next) => {
  try {
    const streak = await SocietyStreak.findOne({
      user: req.user.id,
      society: req.params.societyId
    }).lean();

    res.status(200).json({
      success: true,
      data: streak || {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        activityLog: []
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLeaderboard,
  getLeaderboardHistory,
  getUserBadges,
  getUserStreak
};
