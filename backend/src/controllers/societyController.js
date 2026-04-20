const Society = require("../models/Society");
const SocietyMember = require("../models/SocietyMember");
const ChatChannel = require("../models/ChatChannel");
const ActivityLog = require("../models/ActivityLog");
const SocietyStreak = require("../models/SocietyStreak");
const User = require("../models/User");
const crypto = require("crypto");

// @desc    Create a new society
// @route   POST /api/societies
// @access  Private
const createSociety = async (req, res, next) => {
  try {
    const { name, description, tags, institution, settings, type } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length < 3) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Society name must be at least 3 characters",
        });
    }

    const society = await Society.create({
      name: name.trim(),
      description: description || "",
      type: type === "room" ? "room" : "society",
      owner: userId,
      tags: tags || [],
      institution: institution || "",
      settings: {
        ...settings,
        isPrivate: settings?.isPrivate || false,
        maxMembers: Math.min(settings?.maxMembers || 500, 1000),
      },
      stats: { totalMembers: 1, activeMembers: 1 },
    });

    // Create owner membership
    await SocietyMember.create({
      society: society._id,
      user: userId,
      role: "super_admin",
    });

    // Create default chat channels
    await ChatChannel.createDefaults(society._id, userId);

    // Create streak tracking
    await SocietyStreak.create({ user: userId, society: society._id });

    // Log activity
    await ActivityLog.create({
      society: society._id,
      user: userId,
      action: "society_created",
      targetType: "society",
      targetId: society._id,
    });

    await society.populate("owner", "username fullName avatar");

    res.status(201).json({
      success: true,
      message: "Society created successfully",
      data: society,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A society with this name already exists",
        });
    }
    next(error);
  }
};

// @desc    Get all active societies/rooms (with search & filters)
// @route   GET /api/societies
// @access  Private
const exploreSocieties = async (req, res, next) => {
  try {
    const { search, tag, sort, type, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    // Filter by type: 'room' or 'society'. Defaults to 'society'.
    query.type = type === "room" ? "room" : "society";

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
        { tags: { $regex: sanitized, $options: "i" } },
      ];
    }

    if (tag) {
      query.tags = tag;
    }

    let sortOption = { "stats.totalMembers": -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "active") sortOption = { "stats.weeklyActive": -1 };
    if (sort === "name") sortOption = { name: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Society.countDocuments(query);

    const societies = await Society.find(query)
      .populate("owner", "username fullName avatar")
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add membership status for current user
    const membershipMap = {};
    const memberships = await SocietyMember.find({
      user: req.user.id,
      society: { $in: societies.map((s) => s._id) },
    }).lean();
    memberships.forEach((m) => {
      membershipMap[m.society.toString()] = m.role;
    });

    const enriched = societies.map((s) => ({
      ...s,
      userRole: membershipMap[s._id.toString()] || null,
      isMember: !!membershipMap[s._id.toString()],
    }));

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's joined societies/rooms
// @route   GET /api/societies/my
// @access  Private
const getMySocieties = async (req, res, next) => {
  try {
    const memberships = await SocietyMember.find({
      user: req.user.id,
      isBanned: false,
      isActive: true,
    }).lean();

    const societyIds = memberships.map((m) => m.society);
    const typeFilter = req.query.type === "room" ? "room" : "society";

    const societies = await Society.find({
      _id: { $in: societyIds },
      isActive: true,
      type: typeFilter,
    })
      .populate("owner", "username fullName avatar")
      .sort({ updatedAt: -1 })
      .lean();

    const roleMap = {};
    memberships.forEach((m) => {
      roleMap[m.society.toString()] = m.role;
    });

    const enriched = societies.map((s) => ({
      ...s,
      userRole: roleMap[s._id.toString()],
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched,
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
    const society = await Society.findById(req.params.societyId).populate(
      "owner",
      "username fullName avatar",
    );

    if (!society || !society.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Society not found" });
    }

    const membership = await SocietyMember.findOne({
      society: society._id,
      user: req.user.id,
    }).lean();

    const channels = await ChatChannel.find({
      society: society._id,
      isActive: true,
    })
      .sort({ isDefault: -1, name: 1 })
      .lean();

    const memberCount = await SocietyMember.countDocuments({
      society: society._id,
      isBanned: false,
    });

    res.status(200).json({
      success: true,
      data: {
        ...society.toObject(),
        userRole: membership?.role || null,
        isMember: !!membership,
        isBanned: membership?.isBanned || false,
        channels,
        memberCount,
      },
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
    const { name, description, tags, institution, settings, avatar, banner } =
      req.body;
    const update = {};

    if (name) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (tags) update.tags = tags;
    if (institution !== undefined) update.institution = institution;
    if (avatar) update.avatar = avatar;
    if (banner) update.banner = banner;
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        update[`settings.${key}`] = value;
      }
    }

    const society = await Society.findByIdAndUpdate(
      req.params.societyId,
      { $set: update },
      { new: true, runValidators: true },
    ).populate("owner", "username fullName avatar");

    await ActivityLog.create({
      society: society._id,
      user: req.user.id,
      action: "society_updated",
      targetType: "society",
      targetId: society._id,
      details: { fieldsUpdated: Object.keys(update) },
    });

    res
      .status(200)
      .json({ success: true, message: "Society updated", data: society });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete society
// @route   DELETE /api/societies/:societyId
// @access  Private (owner only)
const deleteSociety = async (req, res, next) => {
  try {
    const societyId = req.params.societyId;
    await Society.findByIdAndUpdate(societyId, { isActive: false });
    await SocietyMember.updateMany({ society: societyId }, { isActive: false });

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "society_deleted",
      targetType: "society",
      targetId: societyId,
    });

    res.status(200).json({ success: true, message: "Society deleted" });
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
      return res
        .status(400)
        .json({ success: false, message: "Invite code is required" });
    }

    const society = await Society.findOne({ inviteCode, isActive: true });
    if (!society) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid invite code" });
    }

    // Check if already a member
    const existing = await SocietyMember.findOne({
      society: society._id,
      user: req.user.id,
    });
    if (existing) {
      if (existing.isBanned) {
        return res
          .status(403)
          .json({
            success: false,
            message: "You are banned from this society",
          });
      }
      return res
        .status(400)
        .json({ success: false, message: "You are already a member" });
    }

    // Check member limit
    const memberCount = await SocietyMember.countDocuments({
      society: society._id,
      isBanned: false,
    });
    if (memberCount >= society.settings.maxMembers) {
      return res
        .status(400)
        .json({ success: false, message: "Society is full" });
    }

    await SocietyMember.create({
      society: society._id,
      user: req.user.id,
      role: "member",
    });

    await SocietyStreak.create({ user: req.user.id, society: society._id });

    society.stats.totalMembers = memberCount + 1;
    await society.save();

    await ActivityLog.create({
      society: society._id,
      user: req.user.id,
      action: "member_joined",
      targetType: "member",
      targetUser: req.user.id,
    });

    res
      .status(200)
      .json({
        success: true,
        message: `Joined ${society.name} successfully`,
        data: { societyId: society._id },
      });
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
      return res
        .status(400)
        .json({
          success: false,
          message: "Owner cannot leave. Transfer ownership first.",
        });
    }

    await SocietyMember.findOneAndDelete({ society: societyId, user: userId });

    const memberCount = await SocietyMember.countDocuments({
      society: societyId,
      isBanned: false,
    });
    await Society.findByIdAndUpdate(societyId, {
      "stats.totalMembers": memberCount,
    });

    await ActivityLog.create({
      society: societyId,
      user: userId,
      action: "member_left",
      targetType: "member",
      targetUser: userId,
    });

    res
      .status(200)
      .json({ success: true, message: "Left society successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get society members
// @route   GET /api/societies/:societyId/members
// @access  Private (member)
const getMembers = async (req, res, next) => {
  const TIMEOUT = 4000;
  
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => 
    timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT)
  );

  const mainLogic = async () => {
    const { societyId } = req.params;
    const { role, search, page = 1, limit = 500 } = req.query;

    const query = { society: societyId, isBanned: false, isActive: true };
    if (role) query.role = role;

    let members = await SocietyMember.find(query)
      .populate("user", "username fullName avatar email platforms")
      .sort({ role: 1, createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    if (search) {
      const regex = new RegExp(search, "i");
      members = members.filter(
        (m) => regex.test(m.user?.username) || regex.test(m.user?.fullName),
      );
    }

    // Fetch PlatformStats for all members and add codingScore
    const PlatformStats = require("../models/PlatformStats");
    const userIds = members.map((m) => m.user?._id).filter(Boolean);
    const platformStats = await PlatformStats.find({
      userId: { $in: userIds },
    })
      .select("userId stats.score")
      .limit(500)
      .lean();

    const statsMap = new Map();
    platformStats.forEach((stat) => {
      if (!stat || !stat.userId) return; // Add safety null check
      const key = stat.userId.toString();
      if (!statsMap.has(key)) statsMap.set(key, []);
      statsMap.get(key).push(stat);
    });

    members = members.map((member) => {
      const userIdStr = member.user?._id?.toString();
      const userStats = statsMap.get(userIdStr) || [];

      let codingScore = 0;
      if (userStats.length > 0) {
        const totalScore = userStats.reduce(
          (sum, stat) => sum + (stat.stats?.score || 0),
          0,
        );
        codingScore = Math.round(totalScore / userStats.length);
      }
      return {
        ...member,
        codingScore,
      };
    });

    return members;
  };

  try {
    const members = await Promise.race([mainLogic(), timeoutPromise]);
    clearTimeout(timeoutId);
    return res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.message === 'TIMEOUT') {
      return res.status(504).json({ success: false, message: '504 Gateway Timeout: Controller (getMembers)' });
    }
    return next(error);
  }
};

// @desc    Kick member
// @route   DELETE /api/societies/:societyId/members/:userId
// @access  Private (admin+)
const kickMember = async (req, res, next) => {
  try {
    const { societyId, userId } = req.params;

    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot kick yourself" });
    }

    const targetMember = await SocietyMember.findOne({
      society: societyId,
      user: userId,
    });
    if (!targetMember) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    // Can't kick someone with equal or higher role
    const { ROLE_HIERARCHY } = require("../middleware/societyAuth");
    if (
      ROLE_HIERARCHY.indexOf(targetMember.role) >=
      ROLE_HIERARCHY.indexOf(req.membership.role)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Cannot kick a member with equal or higher role",
        });
    }

    await SocietyMember.findOneAndDelete({ society: societyId, user: userId });

    const memberCount = await SocietyMember.countDocuments({
      society: societyId,
      isBanned: false,
    });
    await Society.findByIdAndUpdate(societyId, {
      "stats.totalMembers": memberCount,
    });

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "member_kicked",
      targetType: "member",
      targetUser: userId,
    });

    res.status(200).json({ success: true, message: "Member removed" });
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

    const targetMember = await SocietyMember.findOne({
      society: societyId,
      user: userId,
    });
    if (!targetMember) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    const { ROLE_HIERARCHY } = require("../middleware/societyAuth");
    if (
      ROLE_HIERARCHY.indexOf(targetMember.role) >=
      ROLE_HIERARCHY.indexOf(req.membership.role)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Cannot ban a member with equal or higher role",
        });
    }

    targetMember.isBanned = true;
    targetMember.banReason = reason || "Violated community guidelines";
    await targetMember.save();

    const memberCount = await SocietyMember.countDocuments({
      society: societyId,
      isBanned: false,
    });
    await Society.findByIdAndUpdate(societyId, {
      "stats.totalMembers": memberCount,
    });

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "member_banned",
      targetType: "member",
      targetUser: userId,
      details: { reason },
    });

    res.status(200).json({ success: true, message: "Member banned" });
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

    const validRoles = ["member", "moderator", "society_admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const targetMember = await SocietyMember.findOne({
      society: societyId,
      user: userId,
    });
    if (!targetMember) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    const { ROLE_HIERARCHY } = require("../middleware/societyAuth");
    // Can't promote to same or higher level than yourself
    if (
      ROLE_HIERARCHY.indexOf(role) >=
      ROLE_HIERARCHY.indexOf(req.membership.role)
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Cannot assign a role equal to or higher than yours",
        });
    }

    const oldRole = targetMember.role;
    targetMember.role = role;
    await targetMember.save();

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "member_role_changed",
      targetType: "member",
      targetUser: userId,
      details: { oldRole, newRole: role },
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

    const targetMember = await SocietyMember.findOne({
      society: societyId,
      user: userId,
    });
    if (!targetMember) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    if (duration && duration > 0) {
      targetMember.isMuted = true;
      targetMember.mutedUntil = new Date(Date.now() + duration * 60000);
      await targetMember.save();

      await ActivityLog.create({
        society: societyId,
        user: req.user.id,
        action: "member_muted",
        targetType: "member",
        targetUser: userId,
        details: { durationMinutes: duration },
      });

      res
        .status(200)
        .json({
          success: true,
          message: `Member muted for ${duration} minutes`,
        });
    } else {
      targetMember.isMuted = false;
      targetMember.mutedUntil = null;
      await targetMember.save();

      await ActivityLog.create({
        society: societyId,
        user: req.user.id,
        action: "member_unmuted",
        targetType: "member",
        targetUser: userId,
      });

      res.status(200).json({ success: true, message: "Member unmuted" });
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
    const newCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    await Society.findByIdAndUpdate(req.params.societyId, {
      inviteCode: newCode,
    });

    await ActivityLog.create({
      society: req.params.societyId,
      user: req.user.id,
      action: "invite_code_regenerated",
      targetType: "society",
    });

    res.status(200).json({ success: true, data: { inviteCode: newCode } });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member manually (by super admin)
// @route   POST /api/societies/:societyId/members/add
// @access  Private (super_admin only)
const addMemberManually = async (req, res, next) => {
  try {
    const { societyId } = req.params;
    const { userId, username, email } = req.body;

    // Find user by ID, username or email
    let targetUser;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID' });
      }
      targetUser = await User.findById(userId);
    } else if (username) {
      targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    } else if (email) {
      targetUser = await User.findOne({ email: email.trim().toLowerCase() });
    } else {
      return res
        .status(400)
        .json({
          success: false,
          message: "User ID, username, or email is required",
        });
    }

    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Check if already a member
    const existing = await SocietyMember.findOne({
      society: societyId,
      user: targetUser._id,
    });
    if (existing) {
      if (existing.isBanned) {
        return res
          .status(403)
          .json({
            success: false,
            message: "User is banned from this society",
          });
      }
      return res
        .status(400)
        .json({ success: false, message: "User is already a member" });
    }

    // Check member limit
    const society = await Society.findById(societyId);
    const memberCount = await SocietyMember.countDocuments({
      society: societyId,
      isBanned: false,
    });
    if (memberCount >= society.settings.maxMembers) {
      return res
        .status(400)
        .json({ success: false, message: "Society is full" });
    }

    // Add member
    await SocietyMember.create({
      society: societyId,
      user: targetUser._id,
      role: "member",
    });

    await SocietyStreak.create({ user: targetUser._id, society: societyId });

    society.stats.totalMembers = memberCount + 1;
    await society.save();

    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "member_added_manually",
      targetType: "member",
      targetUser: targetUser._id,
      details: { addedBy: req.user.id },
    });

    res.status(200).json({
      success: true,
      message: `${targetUser.username} added successfully`,
      data: { userId: targetUser._id, username: targetUser.username },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users (for manual addition)
// @route   GET /api/societies/:societyId/search-users
// @access  Private (super_admin only)
const searchUsers = async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;
    const { societyId } = req.params;

    console.log("Search request:", { societyId, query, limit });

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Find existing member IDs to exclude them
    const existingMembers = await SocietyMember.find({
      society: societyId,
    })
      .select("user")
      .lean();
    const memberIds = existingMembers.map((m) => m.user.toString());

    console.log("Existing member IDs:", memberIds);

    // Search for users (case-insensitive)
    const searchRegex = new RegExp(query.trim(), "i");
    const users = await User.find({
      _id: { $nin: memberIds },
      $or: [
        { username: searchRegex },
        { email: searchRegex },
        { fullName: searchRegex },
      ],
    })
      .select("username email fullName avatar")
      .limit(parseInt(limit))
      .lean();

    console.log("Found users:", users.length);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Search users error:", error);
    next(error);
  }
};

// @desc    Sync all members' platform data
// @route   POST /api/societies/:societyId/sync
// @access  Private (super_admin or society_admin)
const syncAllMembersData = async (req, res, next) => {
  try {
    const { societyId } = req.params;

    let queueAvailable = false;
    let addBatchSyncJobs;
    try {
      const syncQueue = require("../queues/syncQueue");
      addBatchSyncJobs = syncQueue.addBatchSyncJobs;
      queueAvailable = !!addBatchSyncJobs;
    } catch (err) {
      console.warn("⚠️ Sync Queue not available for Society member syncs");
    }

    if (!queueAvailable) {
      return res.status(503).json({
        success: false,
        message: "Sync queue is currently unavailable. Please try again later.",
      });
    }

    // Get all active members
    const members = await SocietyMember.find({
      society: societyId,
      isBanned: false,
    })
      .select("user")
      .lean();

    if (!members.length) {
      return res
        .status(404)
        .json({ success: false, message: "No members found" });
    }

    const userIds = members.map((m) => m.user);

    // Queue sync jobs
    await addBatchSyncJobs(userIds, {
      priority: 5, // PRIORITY.NORMAL
      triggeredBy: "society_sync",
    });

    // Log the manual sync activity
    await ActivityLog.create({
      society: societyId,
      user: req.user.id,
      action: "settings_updated",
      targetType: "society",
      targetId: societyId,
      details: { action: "Triggered platform stats sync for all members" },
    });

    res.status(202).json({
      success: true,
      message: `Enqueued data sync for ${userIds.length} members. This may take a few minutes.`,
      enqueuedCount: userIds.length,
    });
  } catch (error) {
    console.error("Error triggering member syncs:", error);
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
  regenerateInviteCode,
  addMemberManually,
  searchUsers,
  syncAllMembersData,
};
