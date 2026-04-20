const SocietyMember = require('../models/SocietyMember');
const Society = require('../models/Society');

// Role hierarchy (higher index = more power)
const ROLE_HIERARCHY = ['visitor', 'member', 'moderator', 'society_admin', 'super_admin'];

// Permission map: role -> allowed actions
const PERMISSIONS = {
  visitor: [
    'view_society', 'view_channels', 'view_events', 'view_announcements', 'view_leaderboard'
  ],
  member: [
    'view_society', 'view_channels', 'view_events', 'view_announcements', 'view_leaderboard',
    'send_message', 'react_message', 'create_thread', 'rsvp_event', 'view_members',
    'edit_own_message', 'delete_own_message', 'report_message'
  ],
  moderator: [
    'view_society', 'view_channels', 'view_events', 'view_announcements', 'view_leaderboard',
    'send_message', 'react_message', 'create_thread', 'rsvp_event', 'view_members',
    'edit_own_message', 'delete_own_message', 'report_message',
    'delete_any_message', 'pin_message', 'mute_member', 'unmute_member',
    'create_event', 'edit_event', 'create_announcement', 'manage_channels',
    'view_reports', 'view_activity_log'
  ],
  society_admin: [
    'view_society', 'view_channels', 'view_events', 'view_announcements', 'view_leaderboard',
    'send_message', 'react_message', 'create_thread', 'rsvp_event', 'view_members',
    'edit_own_message', 'delete_own_message', 'report_message',
    'delete_any_message', 'pin_message', 'mute_member', 'unmute_member',
    'create_event', 'edit_event', 'cancel_event', 'create_announcement', 'manage_channels',
    'view_reports', 'view_activity_log',
    'kick_member', 'ban_member', 'change_role', 'edit_society', 'manage_settings',
    'view_analytics', 'regenerate_invite', 'manage_badges'
  ],
  super_admin: [
    'view_society', 'view_channels', 'view_events', 'view_announcements', 'view_leaderboard',
    'send_message', 'react_message', 'create_thread', 'rsvp_event', 'view_members',
    'edit_own_message', 'delete_own_message', 'report_message',
    'delete_any_message', 'pin_message', 'mute_member', 'unmute_member',
    'create_event', 'edit_event', 'cancel_event', 'create_announcement', 'manage_channels',
    'view_reports', 'view_activity_log',
    'kick_member', 'ban_member', 'change_role', 'edit_society', 'manage_settings',
    'view_analytics', 'regenerate_invite', 'manage_badges',
    'delete_society', 'transfer_ownership', 'promote_to_admin', 'manage_all'
  ]
};

/**
 * Middleware: Require society membership (any role).
 * Attaches req.society and req.membership.
 * Expects :societyId in req.params or req.body.societyId.
 */
const requireSocietyMember = async (req, res, next) => {
  const TIMEOUT = 4000;
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT)
  );

  const mainLogic = async () => {
    const societyId = req.params.societyId || req.body.societyId;
    if (!societyId) {
      throw new Error('NO_SOCIETY_ID');
    }

    const society = await Society.findById(societyId);
    if (!society || !society.isActive) {
      throw new Error('SOCIETY_NOT_FOUND');
    }

    const membership = await SocietyMember.findOne({
      society: societyId,
      user: req.user.id,
      isBanned: false
    });

    if (!membership) {
      // Check if society is public - allow visitor access
      if (!society.settings?.isPrivate) {
        req.society = society;
        req.membership = { role: 'visitor', isMuted: false };
        return;
      }
      throw new Error('NOT_MEMBER');
    }

    if (membership.isMuted && membership.mutedUntil && membership.mutedUntil > new Date()) {
      req.isMuted = true;
      req.mutedUntil = membership.mutedUntil;
    } else if (membership.isMuted && membership.mutedUntil && membership.mutedUntil <= new Date()) {
      // Auto-unmute
      membership.isMuted = false;
      membership.mutedUntil = null;
      await membership.save();
    }

    req.society = society;
    req.membership = membership;
  };

  try {
    await Promise.race([mainLogic(), timeoutPromise]);
    return next();
  } catch (error) {
    if (error.message === 'TIMEOUT') {
      return res.status(504).json({ success: false, message: '504 Gateway Timeout: Middleware (requireSocietyMember)' });
    }
    if (error.message === 'NO_SOCIETY_ID') {
      return res.status(400).json({ success: false, message: 'Society ID is required' });
    }
    if (error.message === 'SOCIETY_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'Society not found' });
    }
    if (error.message === 'NOT_MEMBER') {
      return res.status(403).json({ success: false, message: 'You are not a member of this society' });
    }
    return next(error);
  }
};

/**
 * Middleware factory: Require specific permission(s).
 * Must be used after requireSocietyMember.
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const role = req.membership.role;
    const rolePermissions = PERMISSIONS[role] || [];

    const hasAll = permissions.every(p => rolePermissions.includes(p));
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permissions.join(', ')}`
      });
    }

    // Check mute status for message-sending actions
    if (req.isMuted && permissions.some(p => ['send_message', 'create_thread'].includes(p))) {
      return res.status(403).json({
        success: false,
        message: `You are muted until ${req.mutedUntil.toISOString()}`
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require minimum role level.
 * Must be used after requireSocietyMember.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const memberRole = req.membership.role;
    if (!roles.includes(memberRole)) {
      return res.status(403).json({
        success: false,
        message: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require minimum role level in hierarchy.
 * Must be used after requireSocietyMember.
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const memberRoleIndex = ROLE_HIERARCHY.indexOf(req.membership.role);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (memberRoleIndex < requiredRoleIndex) {
      return res.status(403).json({
        success: false,
        message: `Minimum role required: ${minRole}`
      });
    }

    next();
  };
};

/**
 * Check if user is society owner (creator).
 * Must be used after requireSocietyMember.
 */
const requireOwner = (req, res, next) => {
  if (!req.society) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (req.society.owner.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only the society owner can perform this action'
    });
  }

  next();
};

module.exports = {
  requireSocietyMember,
  requirePermission,
  requireRole,
  requireMinRole,
  requireOwner,
  PERMISSIONS,
  ROLE_HIERARCHY
};
