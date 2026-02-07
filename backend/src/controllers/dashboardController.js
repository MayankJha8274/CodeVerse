const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');
const Room = require('../models/Room');
const { getContributionCalendar } = require('../services/aggregationService');

/**
 * Dashboard Controller
 * Handles dashboard and user profile endpoints
 */

/**
 * Get user profile with all stats
 * GET /api/dashboard/profile/:userId
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all platform stats
    const platformStats = await PlatformStats.find({
      userId,
      fetchStatus: 'success'
    });

    // Get last 30 days activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await DailyProgress.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });

    // Calculate totals
    let totalProblems = 0;
    let totalCommits = 0;
    let totalContests = 0;
    let avgRating = 0;
    let ratingCount = 0;

    platformStats.forEach(ps => {
      const stats = ps.stats || {};
      totalProblems += stats.problemsSolved || stats.totalSolved || 0;
      totalCommits += stats.totalCommits || 0;
      totalContests += stats.contestsParticipated || 0;
      
      if (stats.rating && stats.rating > 0) {
        avgRating += stats.rating;
        ratingCount++;
      }
    });

    avgRating = ratingCount > 0 ? Math.round(avgRating / ratingCount) : 0;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          platforms: user.platforms,
          createdAt: user.createdAt,
          lastSynced: user.lastSynced
        },
        stats: {
          totalProblems,
          totalCommits,
          totalContests,
          averageRating: avgRating,
          platformsConnected: platformStats.length
        },
        platformStats: platformStats.map(ps => ({
          platform: ps.platform,
          stats: ps.stats,
          lastFetched: ps.lastFetched
        })),
        recentActivity: recentActivity.slice(0, 7) // Last 7 days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

/**
 * Get current user's summary
 * GET /api/dashboard/summary
 */
exports.getUserSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get platform stats
    const platformStats = await PlatformStats.find({
      userId,
      fetchStatus: 'success'
    });

    // Calculate totals
    let totalProblems = 0;
    let totalCommits = 0;
    let totalContests = 0;
    let avgRating = 0;
    let ratingCount = 0;
    const platforms = {};

    platformStats.forEach(ps => {
      const stats = ps.stats || {};
      const problems = stats.problemsSolved || stats.totalSolved || 0;
      const commits = stats.totalCommits || 0;
      const contests = stats.contestsParticipated || 0;
      const rating = stats.rating || 0;

      totalProblems += problems;
      totalCommits += commits;
      totalContests += contests;
      
      if (rating > 0) {
        avgRating += rating;
        ratingCount++;
      }

      platforms[ps.platform] = {
        problems,
        commits,
        contests,
        rating,
        lastFetched: ps.lastFetched
      };
    });

    avgRating = ratingCount > 0 ? Math.round(avgRating / ratingCount) : 0;

    // Calculate total active days from last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const activeDaysCount = await DailyProgress.countDocuments({
      userId,
      date: { $gte: oneYearAgo },
      $or: [
        { 'changes.problemsDelta': { $gt: 0 } },
        { 'changes.commitsDelta': { $gt: 0 } }
      ]
    });

    // Get today's activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProgress = await DailyProgress.findOne({
      userId,
      date: today
    });

    const todayActivity = todayProgress ? {
      problemsSolved: todayProgress.changes?.problemsDelta || 0,
      commits: todayProgress.changes?.commitsDelta || 0
    } : {
      problemsSolved: 0,
      commits: 0
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          platforms: user.platforms
        },
        totals: {
          problems: totalProblems,
          commits: totalCommits,
          contests: totalContests,
          rating: avgRating,
          platformsConnected: platformStats.length,
          activeDays: activeDaysCount
        },
        platforms,
        today: todayActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user summary',
      error: error.message
    });
  }
};

/**
 * Get user timeline/activity history
 * GET /api/dashboard/timeline?days=30
 */
exports.getUserTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await DailyProgress.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const formattedTimeline = timeline.map(day => ({
      date: day.date,
      stats: {
        totalProblems: day.aggregatedStats?.totalProblemsSolved || 0,
        totalCommits: day.aggregatedStats?.totalCommits || 0,
        totalContests: day.aggregatedStats?.totalContests || 0,
        averageRating: day.aggregatedStats?.averageRating || 0
      },
      changes: {
        problems: day.changes?.problemsDelta || 0,
        commits: day.changes?.commitsDelta || 0,
        rating: day.changes?.ratingDelta || 0
      },
      platforms: day.platformBreakdown || []
    }));

    res.json({
      success: true,
      data: {
        days,
        timeline: formattedTimeline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching timeline',
      error: error.message
    });
  }
};

/**
 * Get user's rooms
 * GET /api/dashboard/rooms
 */
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.find({
      'members.userId': userId
    }).populate('members.userId', 'username email');

    const formattedRooms = rooms.map(room => {
      const isAdmin = room.admins.some(adminId => adminId.toString() === userId);
      const isOwner = room.owner.toString() === userId;

      return {
        id: room._id,
        name: room.name,
        description: room.description,
        inviteCode: room.inviteCode,
        isPrivate: room.isPrivate,
        memberCount: room.members.length,
        isOwner,
        isAdmin,
        joinedAt: room.members.find(m => m.userId._id.toString() === userId)?.joinedAt,
        createdAt: room.createdAt
      };
    });

    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user rooms',
      error: error.message
    });
  }
};

/**
 * Get contribution calendar data (last 365 days)
 * GET /api/dashboard/calendar
 */
exports.getContributionCalendar = async (req, res) => {
  try {
    const userId = req.user.id;

    const calendarData = await getContributionCalendar(userId);

    res.json({
      success: true,
      data: calendarData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contribution calendar',
      error: error.message
    });
  }
};
