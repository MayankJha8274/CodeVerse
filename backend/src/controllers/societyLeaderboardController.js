const SocietyMember = require('../models/SocietyMember');
const LeaderboardSnapshot = require('../models/LeaderboardSnapshot');
const PlatformStats = require('../models/PlatformStats');
const SocietyStreak = require('../models/SocietyStreak');
const UserBadge = require('../models/UserBadge');

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
    const members = await SocietyMember.find({ society: societyId, isBanned: false })
      .populate('user', 'username fullName avatar platforms')
      .lean();

    // Get platform stats for all members
    const userIds = members.map(m => m.user._id || m.user);
    const platformStats = await PlatformStats.find({ user: { $in: userIds } }).lean();
    const streaks = await SocietyStreak.find({ society: societyId, user: { $in: userIds } }).lean();

    const statsMap = {};
    platformStats.forEach(ps => {
      const uid = ps.user.toString();
      if (!statsMap[uid]) statsMap[uid] = { totalSolved: 0, contestRating: 0 };
      statsMap[uid].totalSolved += (ps.stats?.totalSolved || 0);
      statsMap[uid].contestRating = Math.max(statsMap[uid].contestRating, ps.stats?.rating || 0);
    });

    const streakMap = {};
    streaks.forEach(s => { streakMap[s.user.toString()] = s; });

    // Calculate scores
    let rankings = members.map(m => {
      const uid = (m.user._id || m.user).toString();
      const ps = statsMap[uid] || { totalSolved: 0, contestRating: 0 };
      const streak = streakMap[uid] || { currentStreak: 0, totalActiveDays: 0 };

      const breakdown = {
        problemsSolved: ps.totalSolved,
        contestScore: Math.floor(ps.contestRating / 10),
        chatContribution: m.gamification?.messagesCount || 0,
        eventParticipation: m.gamification?.eventsAttended || 0,
        helpfulness: m.gamification?.helpfulnessScore || 0,
        consistency: streak.totalActiveDays || 0
      };

      const score = Object.keys(WEIGHTS).reduce((total, key) => {
        return total + (breakdown[key] * WEIGHTS[key]);
      }, 0);

      return {
        user: m.user,
        role: m.role,
        score,
        breakdown,
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
