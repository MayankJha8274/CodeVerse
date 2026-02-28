const Society = require('../models/Society');
const SocietyMember = require('../models/SocietyMember');
const Message = require('../models/Message');
const SocietyEvent = require('../models/SocietyEvent');
const ActivityLog = require('../models/ActivityLog');
const Announcement = require('../models/Announcement');
const ChatChannel = require('../models/ChatChannel');

// @desc    Get admin analytics for a society
// @route   GET /api/societies/:societyId/analytics
// @access  Private (admin+)
const getSocietyAnalytics = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Parallel queries for efficiency
    const [
      totalMembers,
      newMembers,
      totalMessages,
      recentMessages,
      totalEvents,
      upcomingEvents,
      totalAnnouncements,
      roleDistribution,
      channelStats,
      recentActivity,
      messagesByDay,
      memberGrowth
    ] = await Promise.all([
      SocietyMember.countDocuments({ society: societyId, isBanned: false }),
      SocietyMember.countDocuments({ society: societyId, createdAt: { $gte: since }, isBanned: false }),
      Message.countDocuments({ society: societyId }),
      Message.countDocuments({ society: societyId, createdAt: { $gte: since } }),
      SocietyEvent.countDocuments({ society: societyId }),
      SocietyEvent.countDocuments({ society: societyId, startTime: { $gt: new Date() }, status: 'published' }),
      Announcement.countDocuments({ society: societyId }),
      SocietyMember.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId), isBanned: false } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      ChatChannel.find({ society: societyId, isActive: true })
        .select('name slug messageCount type')
        .sort({ messageCount: -1 })
        .lean(),
      ActivityLog.find({ society: societyId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'username fullName avatar')
        .populate('targetUser', 'username fullName avatar')
        .lean(),
      Message.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId), createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      SocietyMember.aggregate([
        { $match: { society: require('mongoose').Types.ObjectId.createFromHexString(societyId), createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Top contributors
    const topContributors = await SocietyMember.find({ society: societyId, isBanned: false })
      .populate('user', 'username fullName avatar')
      .sort({ contributionScore: -1 })
      .limit(10)
      .lean();

    // Reported messages
    const reportedMessages = await Message.find({
      society: societyId,
      'reports.0': { $exists: true },
      isDeleted: false
    })
      .populate('sender', 'username fullName avatar')
      .populate('reports.user', 'username fullName')
      .sort({ 'reports.reportedAt': -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalMembers,
          newMembers,
          totalMessages,
          recentMessages,
          totalEvents,
          upcomingEvents,
          totalAnnouncements
        },
        roleDistribution: roleDistribution.reduce((acc, r) => { acc[r._id] = r.count; return acc; }, {}),
        channelStats,
        messagesByDay,
        memberGrowth,
        topContributors: topContributors.map(tc => ({
          user: tc.user,
          role: tc.role,
          contributionScore: tc.contributionScore || 0
        })),
        reportedMessages,
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity log
// @route   GET /api/societies/:societyId/activity-log
// @access  Private (moderator+)
const getActivityLog = async (req, res, next) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const query = { society: req.params.societyId };
    if (action) query.action = action;

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'username fullName avatar')
      .populate('targetUser', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSocietyAnalytics,
  getActivityLog
};
