const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocietyBadge',
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    default: null
  },
  awardedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, default: 0 }
  },
  isNotified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userBadgeSchema.index({ user: 1, badge: 1, society: 1 }, { unique: true });
userBadgeSchema.index({ user: 1, awardedAt: -1 });
userBadgeSchema.index({ society: 1, awardedAt: -1 });

module.exports = mongoose.model('UserBadge', userBadgeSchema);
