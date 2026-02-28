const ChatChannel = require('../models/ChatChannel');
const Message = require('../models/Message');
const SocietyMember = require('../models/SocietyMember');
const ActivityLog = require('../models/ActivityLog');
const SocietyStreak = require('../models/SocietyStreak');
const Society = require('../models/Society');

// @desc    Get channels for a society
// @route   GET /api/societies/:societyId/channels
// @access  Private (member)
const getChannels = async (req, res, next) => {
  try {
    const channels = await ChatChannel.find({
      society: req.params.societyId,
      isActive: true
    })
      .populate('lastMessage')
      .sort({ isDefault: -1, name: 1 })
      .lean();

    res.status(200).json({ success: true, data: channels });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a channel
// @route   POST /api/societies/:societyId/channels
// @access  Private (moderator+)
const createChannel = async (req, res, next) => {
  try {
    const { name, description, type, isAdminOnly, isReadOnly } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Channel name must be at least 2 characters' });
    }

    const channel = await ChatChannel.create({
      society: req.params.societyId,
      name: name.trim(),
      description: description || '',
      type: type || 'custom',
      isAdminOnly: isAdminOnly || false,
      isReadOnly: isReadOnly || false,
      createdBy: req.user.id
    });

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'channel_created',
      targetType: 'channel',
      targetId: channel._id
    });

    res.status(201).json({ success: true, message: 'Channel created', data: channel });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a channel
// @route   PUT /api/societies/:societyId/channels/:channelId
// @access  Private (moderator+)
const updateChannel = async (req, res, next) => {
  try {
    const { name, description, isAdminOnly, isReadOnly } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (isAdminOnly !== undefined) update.isAdminOnly = isAdminOnly;
    if (isReadOnly !== undefined) update.isReadOnly = isReadOnly;

    const channel = await ChatChannel.findOneAndUpdate(
      { _id: req.params.channelId, society: req.params.societyId },
      { $set: update },
      { new: true }
    );

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    res.status(200).json({ success: true, data: channel });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a channel
// @route   DELETE /api/societies/:societyId/channels/:channelId
// @access  Private (admin+)
const deleteChannel = async (req, res, next) => {
  try {
    const channel = await ChatChannel.findOne({
      _id: req.params.channelId,
      society: req.params.societyId
    });

    if (!channel) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    if (channel.isDefault) {
      return res.status(400).json({ success: false, message: 'Cannot delete default channels' });
    }

    channel.isActive = false;
    await channel.save();

    res.status(200).json({ success: true, message: 'Channel deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a channel
// @route   GET /api/societies/:societyId/channels/:channelId/messages
// @access  Private (member)
const getMessages = async (req, res, next) => {
  try {
    const { before, limit = 50 } = req.query;
    const query = {
      channel: req.params.channelId,
      society: req.params.societyId,
      isDeleted: false,
      parentMessage: null // Top-level messages only
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username fullName avatar')
      .populate('mentions', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Return in chronological order
    messages.reverse();

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message (REST fallback, primary is via Socket.io)
// @route   POST /api/societies/:societyId/channels/:channelId/messages
// @access  Private (member)
const sendMessage = async (req, res, next) => {
  try {
    const { content, type, codeLanguage, parentMessage, mentions } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Check mute status
    if (req.isMuted) {
      return res.status(403).json({ success: false, message: `You are muted until ${req.mutedUntil}` });
    }

    const message = await Message.create({
      channel: req.params.channelId,
      society: req.params.societyId,
      sender: req.user.id,
      content: content.trim(),
      type: type || 'text',
      codeLanguage: codeLanguage || null,
      parentMessage: parentMessage || null,
      mentions: mentions || []
    });

    // Update thread count if reply
    if (parentMessage) {
      await Message.findByIdAndUpdate(parentMessage, { $inc: { threadCount: 1 } });
    }

    // Update channel stats
    await ChatChannel.findByIdAndUpdate(req.params.channelId, {
      lastMessage: message._id,
      $inc: { messageCount: 1 }
    });

    // Update society stats
    await Society.findByIdAndUpdate(req.params.societyId, {
      $inc: { 'stats.totalMessages': 1 }
    });

    // Update member message count
    await SocietyMember.findOneAndUpdate(
      { society: req.params.societyId, user: req.user.id },
      { $inc: { 'gamification.messagesCount': 1 } }
    );

    // Record streak activity
    const streak = await SocietyStreak.findOne({ user: req.user.id, society: req.params.societyId });
    if (streak) {
      await streak.recordActivity('message');
    }

    await message.populate('sender', 'username fullName avatar');

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get thread messages
// @route   GET /api/societies/:societyId/channels/:channelId/messages/:messageId/thread
// @access  Private (member)
const getThread = async (req, res, next) => {
  try {
    const messages = await Message.find({
      parentMessage: req.params.messageId,
      isDeleted: false
    })
      .populate('sender', 'username fullName avatar')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/societies/:societyId/channels/:channelId/messages/:messageId
// @access  Private (own message or moderator+)
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isOwn = message.sender.toString() === req.user.id;
    const { PERMISSIONS } = require('../middleware/societyAuth');
    const perms = PERMISSIONS[req.membership.role] || [];
    const canDeleteAny = perms.includes('delete_any_message');

    if (!isOwn && !canDeleteAny) {
      return res.status(403).json({ success: false, message: 'Cannot delete this message' });
    }

    message.isDeleted = true;
    message.content = '[Message deleted]';
    await message.save();

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Pin/unpin a message
// @route   POST /api/societies/:societyId/channels/:channelId/messages/:messageId/pin
// @access  Private (moderator+)
const togglePinMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    if (message.isPinned) {
      await ChatChannel.findByIdAndUpdate(req.params.channelId, {
        $addToSet: { pinnedMessages: message._id }
      });
    } else {
      await ChatChannel.findByIdAndUpdate(req.params.channelId, {
        $pull: { pinnedMessages: message._id }
      });
    }

    res.status(200).json({ success: true, message: message.isPinned ? 'Message pinned' : 'Message unpinned' });
  } catch (error) {
    next(error);
  }
};

// @desc    React to a message
// @route   POST /api/societies/:societyId/channels/:channelId/messages/:messageId/react
// @access  Private (member)
const reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(req.user.id);
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(req.user.id);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user.id] });
    }

    await message.save();

    res.status(200).json({ success: true, data: message.reactions });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a message
// @route   POST /api/societies/:societyId/channels/:channelId/messages/:messageId/report
// @access  Private (member)
const reportMessage = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const alreadyReported = message.reports.find(r => r.user.toString() === req.user.id);
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: 'Already reported' });
    }

    message.reports.push({ user: req.user.id, reason: reason || 'Inappropriate content' });
    await message.save();

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'message_reported',
      targetType: 'message',
      targetId: message._id,
      details: { reason }
    });

    res.status(200).json({ success: true, message: 'Message reported' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as solution (doubts channel)
// @route   POST /api/societies/:societyId/channels/:channelId/messages/:messageId/solution
// @access  Private (moderator+ or doubt asker)
const markSolution = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isSolution = !message.isSolution;
    await message.save();

    // Award helpfulness to the answer author
    if (message.isSolution) {
      await SocietyMember.findOneAndUpdate(
        { society: req.params.societyId, user: message.sender },
        { $inc: { 'gamification.helpfulnessScore': 5 } }
      );
    }

    res.status(200).json({ success: true, message: message.isSolution ? 'Marked as solution' : 'Unmarked as solution' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getMessages,
  sendMessage,
  getThread,
  deleteMessage,
  togglePinMessage,
  reactToMessage,
  reportMessage,
  markSolution
};
