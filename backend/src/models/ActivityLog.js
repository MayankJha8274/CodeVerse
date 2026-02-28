const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'society_created', 'society_updated', 'society_deleted',
      'member_joined', 'member_left', 'member_kicked', 'member_banned',
      'member_role_changed', 'member_muted', 'member_unmuted',
      'message_sent', 'message_deleted', 'message_reported', 'message_pinned',
      'channel_created', 'channel_updated', 'channel_deleted',
      'event_created', 'event_updated', 'event_cancelled', 'event_rsvp',
      'event_attended', 'event_feedback',
      'announcement_created', 'announcement_updated', 'announcement_deleted',
      'badge_awarded', 'settings_updated',
      'invite_code_regenerated'
    ],
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  targetType: {
    type: String,
    enum: ['society', 'member', 'message', 'channel', 'event', 'announcement', 'badge', 'settings'],
    default: null
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

activityLogSchema.index({ society: 1, createdAt: -1 });
activityLogSchema.index({ society: 1, action: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ society: 1, user: 1, createdAt: -1 });

// Auto-expire after 90 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
