const Announcement = require('../models/Announcement');
const Society = require('../models/Society');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get announcements for a society
// @route   GET /api/societies/:societyId/announcements
// @access  Private (member)
const getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, pinned } = req.query;
    const query = { society: req.params.societyId };

    // Only show published (non-scheduled or past-scheduled)
    query.$or = [
      { isScheduled: false },
      { isScheduled: true, scheduledAt: { $lte: new Date() } }
    ];

    if (pinned === 'true') query.isPinned = true;

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('author', 'username fullName avatar')
      .populate('taggedMembers', 'username fullName avatar')
      .populate('comments.user', 'username fullName avatar')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    // Add read status for current user
    const enriched = announcements.map(a => ({
      ...a,
      isRead: a.readBy?.some(r => r.user?.toString() === req.user.id) || false
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an announcement
// @route   POST /api/societies/:societyId/announcements
// @access  Private (moderator+)
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, isPinned, isScheduled, scheduledAt, taggedMembers, attachments } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      society: req.params.societyId,
      title,
      content,
      author: req.user.id,
      isPinned: isPinned || false,
      isScheduled: isScheduled || false,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: isScheduled ? null : new Date(),
      taggedMembers: taggedMembers || [],
      attachments: attachments || []
    });

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'announcement_created',
      targetType: 'announcement',
      targetId: announcement._id
    });

    await announcement.populate('author', 'username fullName avatar');

    res.status(201).json({ success: true, message: 'Announcement created', data: announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an announcement
// @route   PUT /api/societies/:societyId/announcements/:announcementId
// @access  Private (moderator+)
const updateAnnouncement = async (req, res, next) => {
  try {
    const { title, content, isPinned, isScheduled, scheduledAt, taggedMembers, attachments } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (isPinned !== undefined) update.isPinned = isPinned;
    if (isScheduled !== undefined) update.isScheduled = isScheduled;
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (taggedMembers !== undefined) update.taggedMembers = taggedMembers;
    if (attachments !== undefined) update.attachments = attachments;

    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.announcementId, society: req.params.societyId },
      { $set: update },
      { new: true, runValidators: true }
    ).populate('author', 'username fullName avatar');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/societies/:societyId/announcements/:announcementId
// @access  Private (admin+)
const deleteAnnouncement = async (req, res, next) => {
  try {
    const result = await Announcement.findOneAndDelete({
      _id: req.params.announcementId,
      society: req.params.societyId
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'announcement_deleted',
      targetType: 'announcement',
      targetId: req.params.announcementId
    });

    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark announcement as read
// @route   POST /api/societies/:societyId/announcements/:announcementId/read
// @access  Private (member)
const markAsRead = async (req, res, next) => {
  try {
    await Announcement.findOneAndUpdate(
      { _id: req.params.announcementId, society: req.params.societyId },
      { $addToSet: { readBy: { user: req.user.id, readAt: new Date() } } }
    );

    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Comment on an announcement
// @route   POST /api/societies/:societyId/announcements/:announcementId/comment
// @access  Private (member)
const commentOnAnnouncement = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const announcement = await Announcement.findOne({
      _id: req.params.announcementId,
      society: req.params.societyId
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    announcement.comments.push({ user: req.user.id, content: content.trim() });
    await announcement.save();

    await announcement.populate('comments.user', 'username fullName avatar');

    res.status(201).json({ success: true, data: announcement.comments });
  } catch (error) {
    next(error);
  }
};

// @desc    React to an announcement
// @route   POST /api/societies/:societyId/announcements/:announcementId/react
// @access  Private (member)
const reactToAnnouncement = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const announcement = await Announcement.findOne({
      _id: req.params.announcementId,
      society: req.params.societyId
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const existingReaction = announcement.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      const userIdx = existingReaction.users.indexOf(req.user.id);
      if (userIdx > -1) {
        existingReaction.users.splice(userIdx, 1);
        if (existingReaction.users.length === 0) {
          announcement.reactions = announcement.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user.id);
      }
    } else {
      announcement.reactions.push({ emoji, users: [req.user.id] });
    }

    await announcement.save();
    res.status(200).json({ success: true, data: announcement.reactions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  commentOnAnnouncement,
  reactToAnnouncement
};
