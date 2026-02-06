const HostedContest = require('../models/HostedContest');
const ContestProblem = require('../models/ContestProblem');
const ContestSubmission = require('../models/ContestSubmission');
const User = require('../models/User');

// ============== CONTEST MANAGEMENT ==============

// @desc    Create a new contest
// @route   POST /api/hosted-contests
// @access  Private
exports.createContest = async (req, res) => {
  try {
    const {
      name,
      description,
      tagline,
      startTime,
      endTime,
      hasNoEndTime,
      timezone,
      organizationType,
      organizationName,
      contestFormat,
      isPublic
    } = req.body;

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (!hasNoEndTime && end <= start) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    const contest = new HostedContest({
      name,
      description: description || '',
      tagline: tagline || '',
      startTime: start,
      endTime: hasNoEndTime ? new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000) : end,
      hasNoEndTime: hasNoEndTime || false,
      timezone: timezone || 'IST',
      organizationType: organizationType || 'personal',
      organizationName: organizationName || '',
      contestFormat: contestFormat || 'normal',
      isPublic: isPublic !== false,
      owner: req.user._id,
      allowedLanguages: ['cpp20', 'java', 'python3', 'pypy3', 'c']
    });

    await contest.save();

    res.status(201).json({
      success: true,
      data: contest
    });
  } catch (error) {
    console.error('Create contest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all contests for user (owned + moderated)
// @route   GET /api/hosted-contests/my-contests
// @access  Private
exports.getMyContests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const contests = await HostedContest.find({
      $or: [
        { owner: userId },
        { 'moderators.user': userId }
      ]
    })
    .populate('owner', 'name email username')
    .sort({ createdAt: -1 });

    // Update status for each contest
    contests.forEach(contest => contest.updateStatus());

    res.json({
      success: true,
      count: contests.length,
      data: contests
    });
  } catch (error) {
    console.error('Get my contests error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get contest by slug
// @route   GET /api/hosted-contests/:slug
// @access  Public (with access control)
exports.getContest = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug })
      .populate('owner', 'name email username')
      .populate('moderators.user', 'name email username')
      .populate({
        path: 'problems',
        select: 'title slug difficulty maxScore problemCode order'
      });

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    contest.updateStatus();
    
    // Check access
    const isOwnerOrMod = req.user && contest.isModerator(req.user._id);
    
    if (!contest.isPublic && !isOwnerOrMod) {
      if (!req.body.accessCode || req.body.accessCode !== contest.accessCode) {
        return res.status(403).json({
          success: false,
          error: 'Access code required for this contest'
        });
      }
    }

    res.json({
      success: true,
      data: contest,
      isOwner: req.user && contest.owner._id.equals(req.user._id),
      isModerator: isOwnerOrMod
    });
  } catch (error) {
    console.error('Get contest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update contest details
// @route   PUT /api/hosted-contests/:slug
// @access  Private (owner/admin only)
exports.updateContest = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this contest'
      });
    }

    // Fields that can be updated
    const updateableFields = [
      'name', 'description', 'tagline', 'startTime', 'endTime', 'hasNoEndTime',
      'timezone', 'organizationType', 'organizationName', 'backgroundImage',
      'useAsOpenGraphImage', 'rules', 'prizes', 'scoring', 'contestFormat',
      'icpcSettings', 'cfSettings', 'normalSettings', 'leaderboardType',
      'showLeaderboardDuringContest', 'forumEnabled', 'restrictedForum',
      'isPublic', 'accessCode', 'allowedLanguages', 'screenLockEnabled',
      'tabSwitchLimit', 'fullscreenRequired', 'copyPasteDisabled', 'maxParticipants'
    ];

    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        contest[field] = req.body[field];
      }
    });

    await contest.save();

    res.json({
      success: true,
      data: contest
    });
  } catch (error) {
    console.error('Update contest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete contest
// @route   DELETE /api/hosted-contests/:slug
// @access  Private (owner only)
exports.deleteContest = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Only owner can delete the contest'
      });
    }

    // Delete all related data
    await ContestProblem.deleteMany({ contest: contest._id });
    await ContestSubmission.deleteMany({ contest: contest._id });
    await contest.deleteOne();

    res.json({
      success: true,
      message: 'Contest deleted successfully'
    });
  } catch (error) {
    console.error('Delete contest error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============== MODERATOR MANAGEMENT ==============

// @desc    Add moderator to contest
// @route   POST /api/hosted-contests/:slug/moderators
// @access  Private (owner/admin only)
exports.addModerator = async (req, res) => {
  try {
    const { userIdentifier, role } = req.body; // email or username
    
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const user = await User.findOne({
      $or: [
        { email: userIdentifier },
        { username: userIdentifier }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if already a moderator
    if (contest.moderators.some(m => m.user.equals(user._id))) {
      return res.status(400).json({
        success: false,
        error: 'User is already a moderator'
      });
    }

    contest.moderators.push({
      user: user._id,
      role: role || 'moderator'
    });

    await contest.save();

    res.json({
      success: true,
      message: 'Moderator added successfully'
    });
  } catch (error) {
    console.error('Add moderator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove moderator from contest
// @route   DELETE /api/hosted-contests/:slug/moderators/:userId
// @access  Private (owner only)
exports.removeModerator = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.owner.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Only owner can remove moderators'
      });
    }

    contest.moderators = contest.moderators.filter(
      m => !m.user.equals(req.params.userId)
    );

    await contest.save();

    res.json({
      success: true,
      message: 'Moderator removed successfully'
    });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============== NOTIFICATIONS ==============

// @desc    Send notification to participants
// @route   POST /api/hosted-contests/:slug/notifications
// @access  Private (owner/moderator)
exports.sendNotification = async (req, res) => {
  try {
    const { message, type } = req.body;
    
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.isModerator(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    contest.notifications.push({
      message,
      type: type || 'info',
      sentBy: req.user._id
    });

    await contest.save();

    // TODO: Implement WebSocket to push real-time notifications

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get notifications for contest
// @route   GET /api/hosted-contests/:slug/notifications
// @access  Public
exports.getNotifications = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug })
      .select('notifications')
      .populate('notifications.sentBy', 'name username');
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    res.json({
      success: true,
      data: contest.notifications.sort((a, b) => b.sentAt - a.sentAt)
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============== SIGNUPS ==============

// @desc    Register for contest
// @route   POST /api/hosted-contests/:slug/signup
// @access  Private
exports.signUp = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Check if already signed up
    if (contest.signups.some(s => s.user.equals(req.user._id))) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this contest'
      });
    }

    // Check max participants
    if (contest.maxParticipants > 0 && contest.signups.length >= contest.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Contest is full'
      });
    }

    contest.signups.push({
      user: req.user._id
    });

    await contest.save();

    res.json({
      success: true,
      message: 'Successfully registered for the contest'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get signups list
// @route   GET /api/hosted-contests/:slug/signups
// @access  Private (owner/moderator)
exports.getSignups = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug })
      .select('signups owner moderators')
      .populate('signups.user', 'name email username');
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.isModerator(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    res.json({
      success: true,
      count: contest.signups.length,
      data: contest.signups
    });
  } catch (error) {
    console.error('Get signups error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============== STATISTICS ==============

// @desc    Get contest statistics
// @route   GET /api/hosted-contests/:slug/statistics
// @access  Private (owner/moderator)
exports.getStatistics = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // Get submission statistics
    const submissionStats = await ContestSubmission.aggregate([
      { $match: { contest: contest._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get problem-wise statistics
    const problemStats = await ContestSubmission.aggregate([
      { $match: { contest: contest._id } },
      {
        $group: {
          _id: '$problem',
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get unique participants
    const uniqueParticipants = await ContestSubmission.distinct('user', { contest: contest._id });

    res.json({
      success: true,
      data: {
        signups: contest.signups.length,
        participants: uniqueParticipants.length,
        submissionStats,
        problemStats,
        contestStatistics: contest.statistics
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============== PUBLIC CONTESTS ==============

// @desc    Get public/upcoming contests
// @route   GET /api/hosted-contests/public
// @access  Public
exports.getPublicContests = async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    
    let filter = { isPublic: true };
    
    const now = new Date();
    
    if (status === 'upcoming') {
      filter.startTime = { $gt: now };
    } else if (status === 'live') {
      filter.startTime = { $lte: now };
      filter.endTime = { $gt: now };
    } else if (status === 'ended') {
      filter.endTime = { $lte: now };
    }

    const contests = await HostedContest.find(filter)
      .populate('owner', 'name username')
      .select('name slug tagline startTime endTime organizationName signups status')
      .sort({ startTime: status === 'ended' ? -1 : 1 })
      .limit(parseInt(limit));

    // Update status for each contest
    contests.forEach(contest => contest.updateStatus());

    res.json({
      success: true,
      count: contests.length,
      data: contests.map(c => ({
        ...c.toObject(),
        signupCount: c.signups.length
      }))
    });
  } catch (error) {
    console.error('Get public contests error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
