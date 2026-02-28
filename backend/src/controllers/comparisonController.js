const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const Room = require('../models/Room');

/**
 * Comparison Controller
 * Handles user-to-user and room comparison endpoints
 */

/**
 * Search users by username or full name
 * GET /api/compare/search-users?q=searchTerm
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const users = await User.find({
      $or: [
        { username: { $regex: sanitized, $options: 'i' } },
        { fullName: { $regex: sanitized, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    })
    .select('username fullName avatar')
    .limit(10);

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

/**
 * Calculate totals from platform stats
 */
const calculateTotals = (platformStats) => {
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

  return {
    problems: totalProblems,
    commits: totalCommits,
    contests: totalContests,
    rating: avgRating,
    platformsActive: platformStats.length
  };
};

/**
 * Calculate user's rank in an array of users
 */
const calculateUserRank = (userId, users) => {
  const sortedUsers = users.sort((a, b) => {
    const scoreA = a.totals.problems + a.totals.commits + (a.totals.rating / 10);
    const scoreB = b.totals.problems + b.totals.commits + (b.totals.rating / 10);
    return scoreB - scoreA;
  });

  return sortedUsers.findIndex(u => u.userId.toString() === userId.toString()) + 1;
};

/**
 * Compare two users
 * GET /api/compare/users?u1=userId1&u2=userId2
 */
exports.compareUsers = async (req, res) => {
  try {
    const { u1, u2 } = req.query;

    if (!u1 || !u2) {
      return res.status(400).json({
        success: false,
        message: 'Both user IDs (u1 and u2) are required'
      });
    }

    // Fetch both users
    const [user1, user2] = await Promise.all([
      User.findById(u1).select('-password'),
      User.findById(u2).select('-password')
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({
        success: false,
        message: 'One or both users not found'
      });
    }

    // Fetch platform stats for both users
    const [stats1, stats2] = await Promise.all([
      PlatformStats.find({ userId: u1, fetchStatus: 'success' }),
      PlatformStats.find({ userId: u2, fetchStatus: 'success' })
    ]);

    const totals1 = calculateTotals(stats1);
    const totals2 = calculateTotals(stats2);

    // Calculate differences
    const comparison = {
      user1: {
        id: user1._id,
        username: user1.username,
        email: user1.email,
        totals: totals1
      },
      user2: {
        id: user2._id,
        username: user2.username,
        email: user2.email,
        totals: totals2
      },
      differences: {
        problems: totals1.problems - totals2.problems,
        commits: totals1.commits - totals2.commits,
        contests: totals1.contests - totals2.contests,
        rating: totals1.rating - totals2.rating
      },
      winner: {
        problems: totals1.problems > totals2.problems ? user1.username : totals2.problems > totals1.problems ? user2.username : 'Tie',
        commits: totals1.commits > totals2.commits ? user1.username : totals2.commits > totals1.commits ? user2.username : 'Tie',
        contests: totals1.contests > totals2.contests ? user1.username : totals2.contests > totals1.contests ? user2.username : 'Tie',
        rating: totals1.rating > totals2.rating ? user1.username : totals2.rating > totals1.rating ? user2.username : 'Tie'
      }
    };

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing users',
      error: error.message
    });
  }
};

/**
 * Compare user with room averages
 * GET /api/compare/room/:roomId
 */
exports.compareWithRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if room exists and user is a member
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const isMember = room.members.some(m => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Get current user's stats
    const userStats = await PlatformStats.find({
      userId,
      fetchStatus: 'success'
    });
    const userTotals = calculateTotals(userStats);

    // Get all members' stats
    const memberIds = room.members.map(m => m.userId);
    const allMembersData = [];

    for (const memberId of memberIds) {
      const memberStats = await PlatformStats.find({
        userId: memberId,
        fetchStatus: 'success'
      });
      const totals = calculateTotals(memberStats);
      allMembersData.push({
        userId: memberId,
        totals
      });
    }

    // Calculate room averages
    const roomAverages = {
      problems: Math.round(allMembersData.reduce((sum, m) => sum + m.totals.problems, 0) / allMembersData.length),
      commits: Math.round(allMembersData.reduce((sum, m) => sum + m.totals.commits, 0) / allMembersData.length),
      contests: Math.round(allMembersData.reduce((sum, m) => sum + m.totals.contests, 0) / allMembersData.length),
      rating: Math.round(allMembersData.reduce((sum, m) => sum + m.totals.rating, 0) / allMembersData.length)
    };

    // Calculate user's rank in room
    const userRank = calculateUserRank(userId, allMembersData);

    res.json({
      success: true,
      data: {
        room: {
          id: room._id,
          name: room.name,
          memberCount: room.members.length
        },
        user: {
          totals: userTotals,
          rank: userRank,
          rankPercentile: Math.round(((room.members.length - userRank + 1) / room.members.length) * 100)
        },
        roomAverages,
        comparison: {
          problems: userTotals.problems - roomAverages.problems,
          commits: userTotals.commits - roomAverages.commits,
          contests: userTotals.contests - roomAverages.contests,
          rating: userTotals.rating - roomAverages.rating
        },
        status: {
          problems: userTotals.problems >= roomAverages.problems ? 'above' : 'below',
          commits: userTotals.commits >= roomAverages.commits ? 'above' : 'below',
          contests: userTotals.contests >= roomAverages.contests ? 'above' : 'below',
          rating: userTotals.rating >= roomAverages.rating ? 'above' : 'below'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error comparing with room',
      error: error.message
    });
  }
};

/**
 * Get top performers (global or room-specific)
 * GET /api/compare/top?limit=10&roomId=optional
 */
exports.getTopPerformers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { roomId } = req.query;

    let userIds;

    if (roomId) {
      // Room-specific leaderboard
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }
      userIds = room.members.map(m => m.userId);
    } else {
      // Global leaderboard
      const allUsers = await User.find({ isActive: true }).limit(100);
      userIds = allUsers.map(u => u._id);
    }

    // Get stats for all users
    const topPerformers = [];

    for (const userId of userIds) {
      const user = await User.findById(userId).select('-password');
      const stats = await PlatformStats.find({
        userId,
        fetchStatus: 'success'
      });

      const totals = calculateTotals(stats);
      
      // Calculate score (problems + commits + rating/10)
      const score = totals.problems + totals.commits + Math.round(totals.rating / 10);

      topPerformers.push({
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        },
        totals,
        score
      });
    }

    // Sort by score and get top N
    topPerformers.sort((a, b) => b.score - a.score);
    const topN = topPerformers.slice(0, limit);

    // Add rank
    const rankedPerformers = topN.map((performer, index) => ({
      rank: index + 1,
      ...performer
    }));

    res.json({
      success: true,
      data: {
        scope: roomId ? 'room' : 'global',
        roomId: roomId || null,
        totalUsers: topPerformers.length,
        topPerformers: rankedPerformers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top performers',
      error: error.message
    });
  }
};
