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
  try {
    const societyId = req.params.societyId || req.body.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: 'Society ID is required' });
    }

    const society = await Society.findById(societyId);
    if (!society || !society.isActive) {
      return res.status(404).json({ success: false, message: 'Society not found' });
    }

    const membership = await SocietyMember.findOne({
      society: societyId,
      user: req.user.id,
      isBanned: false
    });

    if (!membership) {
      // Check if society is public - allow visitor access
      if (!society.settings.isPrivate) {
        req.society = society;
        req.membership = { role: 'visitor', isMuted: false };
        return next();
      }
      return res.status(403).json({ success: false, message: 'You are not a member of this society' });
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
    next();
  } catch (error) {
    next(error);
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
