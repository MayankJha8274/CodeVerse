const Room = require('../models/Room');
const User = require('../models/User');
const PlatformStats = require('../models/PlatformStats');
const DailyProgress = require('../models/DailyProgress');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    const userId = req.user.id;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    // Create room with owner as first member
    const room = await Room.create({
      name,
      description: description || '',
      owner: userId,
      members: [{
        user: userId,
        role: 'owner',
        joinedAt: new Date()
      }],
      settings: settings || {},
      stats: {
        totalMembers: 1,
        activeMembers: 1
      }
    });

    // Populate owner details
    await room.populate('members.user', 'username email fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms for current user
// @route   GET /api/rooms
// @access  Private
const getUserRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.find({
      'members.user': userId,
      isActive: true
    })
      .populate('owner', 'username fullName avatar')
      .populate('members.user', 'username fullName avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private (member only)
const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id)
      .populate('owner', 'username email fullName avatar')
      .populate('members.user', 'username email fullName avatar platforms');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a member
    if (!room.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (owner/admin only)
const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, settings } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is admin or owner
    if (!room.isUserAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner or admin can update room details'
      });
    }

    // Update fields
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (settings) room.settings = { ...room.settings, ...settings };

    await room.save();
    await room.populate('members.user', 'username fullName avatar');

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (owner only)
const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is owner
    if (room.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can delete the room'
      });
    }

    // Soft delete
    room.isActive = false;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join room with invite code
// @route   POST /api/rooms/join
// @access  Private
const joinRoom = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const room = await Room.findOne({ inviteCode: inviteCode.toUpperCase(), isActive: true });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if already a member
    if (room.isUserMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this room'
      });
    }

    // Check max members limit
    if (room.members.length >= room.settings.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Room has reached maximum member limit'
      });
    }

    // Add user as member
    room.members.push({
      user: userId,
      role: 'member',
      joinedAt: new Date()
    });

    room.stats.totalMembers = room.members.length;
    await room.save();
    await room.populate('members.user', 'username fullName avatar');

    res.status(200).json({
      success: true,
      message: 'Successfully joined the room',
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave room
// @route   POST /api/rooms/:id/leave
// @access  Private
const leaveRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Owner cannot leave - must delete room instead
    if (room.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Room owner cannot leave. Delete the room instead.'
      });
    }

    // Check if user is a member
    if (!room.isUserMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Remove member
    room.members = room.members.filter(m => m.user.toString() !== userId.toString());
    room.stats.totalMembers = room.members.length;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the room'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from room
// @route   DELETE /api/rooms/:id/members/:userId
// @access  Private (owner/admin only)
const removeMember = async (req, res, next) => {
  try {
    const { id, userId: memberToRemove } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if requester is admin or owner
    if (!room.isUserAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner or admin can remove members'
      });
    }

    // Cannot remove owner
    if (room.owner.toString() === memberToRemove) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove room owner'
      });
    }

    // Check if member exists
    const memberExists = room.isUserMember(memberToRemove);
    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this room'
      });
    }

    // Remove member
    room.members = room.members.filter(m => m.user.toString() !== memberToRemove);
    room.stats.totalMembers = room.members.length;
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room leaderboard
// @route   GET /api/rooms/:id/leaderboard
// @access  Private (member only)
const getRoomLeaderboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period = 'weekly' } = req.query; // daily, weekly, monthly, alltime
    const userId = req.user.id;

    const room = await Room.findById(id).populate('members.user', 'username fullName avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is a member
    if (!room.isUserMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'alltime':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get stats for all members
    const memberIds = room.members.map(m => m.user._id);
    
    const leaderboardData = await Promise.all(
      memberIds.map(async (memberId) => {
        // Get platform stats
        const platformStats = await PlatformStats.find({
          user: memberId
        });

        // Get daily progress in date range
        const dailyProgress = await DailyProgress.find({
          user: memberId,
          date: { $gte: startDate }
        });

        // Calculate total problems solved
        const totalProblems = platformStats.reduce((sum, stat) => {
          return sum + (stat.problemsSolved || 0);
        }, 0);

        // Calculate commits (GitHub)
        const githubStat = platformStats.find(s => s.platform === 'github');
        const totalCommits = githubStat?.stats?.totalCommits || 0;

        // Calculate average rating (CP platforms)
        const cpPlatforms = platformStats.filter(s => 
          ['codeforces', 'codechef', 'atcoder'].includes(s.platform)
        );
        const avgRating = cpPlatforms.length > 0
          ? cpPlatforms.reduce((sum, p) => sum + (p.stats?.rating || 0), 0) / cpPlatforms.length
          : 0;

        // Problems solved in period
        const problemsInPeriod = dailyProgress.reduce((sum, day) => {
          return sum + (day.problemsSolved || 0);
        }, 0);

        const member = room.members.find(m => m.user._id.toString() === memberId.toString());

        return {
          userId: memberId,
          username: member.user.username,
          fullName: member.user.fullName,
          avatar: member.user.avatar,
          totalProblems,
          totalCommits,
          avgRating: Math.round(avgRating),
          problemsInPeriod,
          joinedAt: member.joinedAt,
          score: totalProblems + totalCommits + Math.round(avgRating / 10) // Simple scoring
        };
      })
    );

    // Sort by score
    leaderboardData.sort((a, b) => b.score - a.score);

    // Add rank
    leaderboardData.forEach((member, index) => {
      member.rank = index + 1;
    });

    res.status(200).json({
      success: true,
      period,
      data: leaderboardData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room analytics (owner only)
// @route   GET /api/rooms/:id/analytics
// @access  Private (owner/admin only)
const getRoomAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id).populate('members.user', 'username platforms');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is admin or owner
    if (!room.isUserAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner or admin can view analytics'
      });
    }

    const memberIds = room.members.map(m => m.user._id);

    // Get all platform stats
    const allPlatformStats = await PlatformStats.find({
      user: { $in: memberIds }
    });

    // Get last 30 days of progress
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = await DailyProgress.find({
      user: { $in: memberIds },
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    // Calculate aggregated stats
    const analytics = {
      totalMembers: room.members.length,
      activeMembers: room.stats.activeMembers,
      totalProblems: allPlatformStats.reduce((sum, stat) => sum + (stat.problemsSolved || 0), 0),
      avgProblemsPerMember: 0,
      totalCommits: 0,
      platformDistribution: {},
      activityTimeline: [],
      topPerformers: []
    };

    // Calculate platform distribution
    allPlatformStats.forEach(stat => {
      if (!analytics.platformDistribution[stat.platform]) {
        analytics.platformDistribution[stat.platform] = 0;
      }
      analytics.platformDistribution[stat.platform] += stat.problemsSolved || 0;
    });

    // Calculate commits
    const githubStats = allPlatformStats.filter(s => s.platform === 'github');
    analytics.totalCommits = githubStats.reduce((sum, stat) => sum + (stat.stats?.totalCommits || 0), 0);

    // Average problems per member
    analytics.avgProblemsPerMember = Math.round(analytics.totalProblems / room.members.length);

    // Activity timeline (last 30 days)
    const timelineMap = {};
    recentProgress.forEach(progress => {
      const dateStr = progress.date.toISOString().split('T')[0];
      if (!timelineMap[dateStr]) {
        timelineMap[dateStr] = 0;
      }
      timelineMap[dateStr] += progress.problemsSolved || 0;
    });

    analytics.activityTimeline = Object.entries(timelineMap).map(([date, problems]) => ({
      date,
      problems
    }));

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Promote member to admin
// @route   PATCH /api/rooms/:id/members/:userId/promote
// @access  Private (owner only)
const promoteMember = async (req, res, next) => {
  try {
    const { id, userId: memberToPromote } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Only owner can promote
    if (room.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only room owner can promote members'
      });
    }

    // Find member
    const member = room.members.find(m => m.user.toString() === memberToPromote);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Update role
    member.role = 'admin';
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Member promoted to admin successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getUserRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  removeMember,
  getRoomLeaderboard,
  getRoomAnalytics,
  promoteMember
};
