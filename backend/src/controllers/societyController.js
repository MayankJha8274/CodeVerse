const Society = require('../models/Society');
const SocietyMember = require('../models/SocietyMember');
const ChatChannel = require('../models/ChatChannel');
const ActivityLog = require('../models/ActivityLog');
const SocietyStreak = require('../models/SocietyStreak');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new society
// @route   POST /api/societies
// @access  Private
const createSociety = async (req, res, next) => {
  try {
    const { name, description, tags, institution, settings } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Society name must be at least 3 characters' });
    }

    const society = await Society.create({
      name: name.trim(),
      description: description || '',
      owner: userId,
      tags: tags || [],
      institution: institution || '',
      settings: {
        ...settings,
        isPrivate: settings?.isPrivate || false,
        maxMembers: Math.min(settings?.maxMembers || 500, 1000)
      },
      stats: { totalMembers: 1, activeMembers: 1 }
    });

    // Create owner membership
    await SocietyMember.create({
      society: society._id,
      user: userId,
      role: 'super_admin'
    });

    // Create default chat channels
    await ChatChannel.createDefaults(society._id, userId);

    // Create streak tracking
    await SocietyStreak.create({ user: userId, society: society._id });

    // Log activity
    await ActivityLog.create({
      society: society._id,
      user: userId,
      action: 'society_created',
      targetType: 'society',
      targetId: society._id
    });

    await society.populate('owner', 'username fullName avatar');

    res.status(201).json({
      success: true,
      message: 'Society created successfully',
      data: society
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A society with this name already exists' });
    }
    next(error);
  }
};

// @desc    Get all societies (explore)
// @route   GET /api/societies
// @access  Private
const exploreSocieties = async (req, res, next) => {
  try {
    const { search, tag, sort, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    let sortOption = { 'stats.totalMembers': -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'active') sortOption = { 'stats.weeklyActive': -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Society.countDocuments(query);

    const societies = await Society.find(query)
      .populate('owner', 'username fullName avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add membership status for current user
    const membershipMap = {};
    const memberships = await SocietyMember.find({
      user: req.user.id,
      society: { $in: societies.map(s => s._id) }
    }).lean();
    memberships.forEach(m => { membershipMap[m.society.toString()] = m.role; });

    const enriched = societies.map(s => ({
      ...s,
      userRole: membershipMap[s._id.toString()] || null,
      isMember: !!membershipMap[s._id.toString()]
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's joined societies
// @route   GET /api/societies/my
// @access  Private
const getMySocieties = async (req, res, next) => {
  try {
    const memberships = await SocietyMember.find({
      user: req.user.id,
      isBanned: false
    }).lean();

    const societyIds = memberships.map(m => m.society);
    const societies = await Society.find({
      _id: { $in: societyIds },
      isActive: true
    })
      .populate('owner', 'username fullName avatar')
      .sort({ updatedAt: -1 })
      .lean();

    const roleMap = {};
    memberships.forEach(m => { roleMap[m.society.toString()] = m.role; });

    const enriched = societies.map(s => ({
      ...s,
      userRole: roleMap[s._id.toString()]
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get society by ID
// @route   GET /api/societies/:societyId
// @access  Private
const getSocietyById = async (req, res, next) => {
  try {
    const society = await Society.findById(req.params.societyId)
      .populate('owner', 'username fullName avatar');

    if (!society || !society.isActive) {
      return res.status(404).json({ success: false, message: 'Society not found' });
    }

    const membership = await SocietyMember.findOne({
      society: society._id,
      user: req.user.id
    }).lean();

    const channels = await ChatChannel.find({
      society: society._id,
      isActive: true
    }).sort({ isDefault: -1, name: 1 }).lean();

    const memberCount = await SocietyMember.countDocuments({
      society: society._id,
      isBanned: false
    });

    res.status(200).json({
      success: true,
      data: {
        ...society.toObject(),
        userRole: membership?.role || null,
        isMember: !!membership,
        isBanned: membership?.isBanned || false,
        channels,
        memberCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update society
// @route   PUT /api/societies/:societyId
// @access  Private (admin+)
const updateSociety = async (req, res, next) => {
  try {
    const { name, description, tags, institution, settings, avatar, banner } = req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (tags) update.tags = tags;
    if (institution !== undefined) update.institution = institution;
    if (avatar) update.avatar = avatar;
    if (banner) update.banner = banner;
    if (settings) update.settings = { ...req.society.settings.toObject(), ...settings };

    const society = await Society.findByIdAndUpdate(
      req.params.societyId,
      { $set: update },
      { new: true, runValidators: true }
    ).populate('owner', 'username fullName avatar');

    await ActivityLog.create({
      society: society._id,
      user: req.user.id,
      action: 'society_updated',
      targetType: 'society',
      targetId: society._id,
      details: { fieldsUpdated: Object.keys(update) }
    });

    res.status(200).json({ success: true, message: 'Society updated', data: society });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete society
// @route   DELETE /api/societies/:societyId
// @access  Private (owner only)
const deleteSociety = async (req, res, next) => {
  try {
    await Society.findByIdAndUpdate(req.params.societyId, { isActive: false });
    res.status(200).json({ success: true, message: 'Society deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Join society via invite code
// @route   POST /api/societies/join
// @access  Private
const joinSociety = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ success: false, message: 'Invite code is required' });
    }

    const society = await Society.findOne({ inviteCode, isActive: true });
    if (!society) {
      return res.status(404).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if already a member
    const existing = await SocietyMember.findOne({ society: society._id, user: req.user.id });
    if (existing) {
      if (existing.isBanned) {
        return res.status(403).json({ success: false, message: 'You are banned from this society' });
      }
      return res.status(400).json({ success: false, message: 'You are already a member' });
    }

    // Check member limit
    const memberCount = await SocietyMember.countDocuments({ society: society._id, isBanned: false });
    if (memberCount >= society.settings.maxMembers) {
      return res.status(400).json({ success: false, message: 'Society is full' });
    }

    await SocietyMember.create({
      society: society._id,
      user: req.user.id,
      role: 'member'
    });

    await SocietyStreak.create({ user: req.user.id, society: society._id });

    society.stats.totalMembers = memberCount + 1;
    await society.save();

    await ActivityLog.create({
      society: society._id,
      user: req.user.id,
      action: 'member_joined',
      targetType: 'member',
      targetUser: req.user.id
    });

    res.status(200).json({ success: true, message: `Joined ${society.name} successfully`, data: { societyId: society._id } });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave society
// @route   POST /api/societies/:societyId/leave
// @access  Private (member)
const leaveSociety = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const userId = req.user.id;

    // Owner can't leave
    if (req.society.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Owner cannot leave. Transfer ownership first.' });
    }

    await SocietyMember.findOneAndDelete({ society: societyId, user: userId });

    const memberCount = await SocietyMember.countDocuments({ society: societyId, isBanned: false });
    await Society.findByIdAndUpdate(societyId, { 'stats.totalMembers': memberCount });

    await ActivityLog.create({
      society: societyId,
      user: userId,
      action: 'member_left',
      targetType: 'member',
      targetUser: userId
    });

    res.status(200).json({ success: true, message: 'Left society successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get society members
// @route   GET /api/societies/:societyId/members
// @access  Private (member)
const getMembers = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { role, search, page = 1, limit = 50 } = req.query;

    const query = { society: societyId, isBanned: false };
    if (role) query.role = role;

    let members = await SocietyMember.find(query)
      .populate('user', 'username fullName avatar email platforms')
      .sort({ role: 1, createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    if (search) {
      const regex = new RegExp(search, 'i');
      members = members.filter(m => 
        regex.test(m.user?.username) || regex.test(m.user?.fullName)
      );
    }

    const total = await SocietyMember.countDocuments(query);

    res.status(200).json({
      success: true,
      data: members,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Kick member
// @route   DELETE /api/societies/:societyId/members/:userId
// @access  Private (admin+)
const kickMember = async (req, res, next) => {
  try {
    const { societyId, userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot kick yourself' });
    }

    const targetMember = await SocietyMember.findOne({ society: societyId, user: userId });
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Can't kick someone with equal or higher role
    const { ROLE_HIERARCHY } = require('../middleware/societyAuth');
    if (ROLE_HIERARCHY.indexOf(targetMember.role) >= ROLE_HIERARCHY.indexOf(req.membership.role)) {
      return res.status(403).json({ success: false, message: 'Cannot kick a member with equal or higher role' });
    }

    await SocietyMember.findOneAndDelete({ society: societyId, user: userId });

    const memberCount = await SocietyMember.countDocuments({ society: societyId, isBanned: false });
    await Society.findByIdAndUpdate(societyId, { 'stats.totalMembers': memberCount });

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: 'member_kicked',
      targetType: 'member',
      targetUser: userId
    });

    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban member
// @route   POST /api/societies/:societyId/members/:userId/ban
// @access  Private (admin+)
const banMember = async (req, res, next) => {
  try {
    const { societyId, userId } = req.params;
    const { reason } = req.body;

    const targetMember = await SocietyMember.findOne({ society: societyId, user: userId });
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const { ROLE_HIERARCHY } = require('../middleware/societyAuth');
    if (ROLE_HIERARCHY.indexOf(targetMember.role) >= ROLE_HIERARCHY.indexOf(req.membership.role)) {
      return res.status(403).json({ success: false, message: 'Cannot ban a member with equal or higher role' });
    }

    targetMember.isBanned = true;
    targetMember.banReason = reason || 'Violated community guidelines';
    await targetMember.save();

    const memberCount = await SocietyMember.countDocuments({ society: societyId, isBanned: false });
    await Society.findByIdAndUpdate(societyId, { 'stats.totalMembers': memberCount });

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: 'member_banned',
      targetType: 'member',
      targetUser: userId,
      details: { reason }
    });

    res.status(200).json({ success: true, message: 'Member banned' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change member role
// @route   PUT /api/societies/:societyId/members/:userId/role
// @access  Private (admin+)
const changeMemberRole = async (req, res, next) => {
  try {
    const { societyId, userId } = req.params;
    const { role } = req.body;

    const validRoles = ['member', 'moderator', 'society_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const targetMember = await SocietyMember.findOne({ society: societyId, user: userId });
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const { ROLE_HIERARCHY } = require('../middleware/societyAuth');
    // Can't promote to same or higher level than yourself
    if (ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(req.membership.role)) {
      return res.status(403).json({ success: false, message: 'Cannot assign a role equal to or higher than yours' });
    }

    const oldRole = targetMember.role;
    targetMember.role = role;
    await targetMember.save();

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: 'member_role_changed',
      targetType: 'member',
      targetUser: userId,
      details: { oldRole, newRole: role }
    });

    res.status(200).json({ success: true, message: `Role changed to ${role}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Mute/unmute member
// @route   POST /api/societies/:societyId/members/:userId/mute
// @access  Private (moderator+)
const toggleMuteMember = async (req, res, next) => {
  try {
    const { societyId, userId } = req.params;
    const { duration } = req.body; // in minutes, 0 = unmute

    const targetMember = await SocietyMember.findOne({ society: societyId, user: userId });
    if (!targetMember) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (duration && duration > 0) {
      targetMember.isMuted = true;
      targetMember.mutedUntil = new Date(Date.now() + duration * 60000);
      await targetMember.save();

      await ActivityLog.create({
        society: societyId, user: req.user.id,
        action: 'member_muted', targetType: 'member', targetUser: userId,
        details: { durationMinutes: duration }
      });

      res.status(200).json({ success: true, message: `Member muted for ${duration} minutes` });
    } else {
      targetMember.isMuted = false;
      targetMember.mutedUntil = null;
      await targetMember.save();

      await ActivityLog.create({
        society: societyId, user: req.user.id,
        action: 'member_unmuted', targetType: 'member', targetUser: userId
      });

      res.status(200).json({ success: true, message: 'Member unmuted' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate invite code
// @route   POST /api/societies/:societyId/regenerate-invite
// @access  Private (admin+)
const regenerateInviteCode = async (req, res, next) => {
  try {
    const newCode = crypto.randomBytes(4).toString('hex');
    await Society.findByIdAndUpdate(req.params.societyId, { inviteCode: newCode });

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: 'invite_code_regenerated',
      targetType: 'society'
    });

    res.status(200).json({ success: true, data: { inviteCode: newCode } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSociety,
  exploreSocieties,
  getMySocieties,
  getSocietyById,
  updateSociety,
  deleteSociety,
  joinSociety,
  leaveSociety,
  getMembers,
  kickMember,
  banMember,
  changeMemberRole,
  toggleMuteMember,
  regenerateInviteCode
};
