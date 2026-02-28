const mongoose = require('mongoose');

const ROLES = ['super_admin', 'society_admin', 'moderator', 'member', 'visitor'];

const societyMemberSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ROLES,
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  mutedUntil: {
    type: Date,
    default: null
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: ''
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  // Gamification
  contributionScore: {
    type: Number,
    default: 0
  },
  helpfulnessScore: {
    type: Number,
    default: 0
  },
  messagesCount: {
    type: Number,
    default: 0
  },
  eventsAttended: {
    type: Number,
    default: 0
  },
  notificationPrefs: {
    chat: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Compound indexes
societyMemberSchema.index({ society: 1, user: 1 }, { unique: true });
societyMemberSchema.index({ society: 1, role: 1 });
societyMemberSchema.index({ society: 1, isActive: 1 });
societyMemberSchema.index({ user: 1, isActive: 1 });
societyMemberSchema.index({ society: 1, contributionScore: -1 });
societyMemberSchema.index({ society: 1, lastActiveAt: -1 });

// Statics
societyMemberSchema.statics.ROLES = ROLES;

societyMemberSchema.statics.getMemberRole = async function(societyId, userId) {
  const member = await this.findOne({ society: societyId, user: userId, isActive: true });
  return member ? member.role : null;
};

societyMemberSchema.statics.isMember = async function(societyId, userId) {
  return !!(await this.findOne({ society: societyId, user: userId, isActive: true, isBanned: false }));
};

module.exports = mongoose.model('SocietyMember', societyMemberSchema);
