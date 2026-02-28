const mongoose = require('mongoose');

const societyBadgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏅'
  },
  category: {
    type: String,
    enum: ['participation', 'performance', 'contribution', 'streak', 'special'],
    required: true
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  criteria: {
    type: { type: String, enum: [
      'problems_solved', 'messages_sent', 'events_attended',
      'streak_days', 'helpful_answers', 'contest_wins',
      'society_joined_days', 'doubts_resolved', 'custom'
    ]},
    threshold: { type: Number, required: true },
    description: { type: String }
  },
  xpReward: {
    type: Number,
    default: 10
  },
  isGlobal: {
    type: Boolean,
    default: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

societyBadgeSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

societyBadgeSchema.index({ category: 1, tier: 1 });
societyBadgeSchema.index({ isGlobal: 1 });
societyBadgeSchema.index({ society: 1, isActive: 1 });

// Seed default badges
societyBadgeSchema.statics.seedDefaults = async function() {
  const count = await this.countDocuments({ isGlobal: true });
  if (count > 0) return;

  const defaults = [
    { name: 'First Steps', description: 'Joined your first society', icon: '👣', category: 'participation', tier: 'bronze', criteria: { type: 'society_joined_days', threshold: 1, description: 'Join a society' }, xpReward: 5 },
    { name: 'Problem Solver', description: 'Solved 10 problems', icon: '🧩', category: 'performance', tier: 'bronze', criteria: { type: 'problems_solved', threshold: 10 }, xpReward: 10 },
    { name: 'Century Club', description: 'Solved 100 problems', icon: '💯', category: 'performance', tier: 'silver', criteria: { type: 'problems_solved', threshold: 100 }, xpReward: 50 },
    { name: 'Problem Machine', description: 'Solved 500 problems', icon: '⚡', category: 'performance', tier: 'gold', criteria: { type: 'problems_solved', threshold: 500 }, xpReward: 100 },
    { name: 'Chat Starter', description: 'Sent 50 messages', icon: '💬', category: 'contribution', tier: 'bronze', criteria: { type: 'messages_sent', threshold: 50 }, xpReward: 10 },
    { name: 'Chatterbox', description: 'Sent 500 messages', icon: '🗣️', category: 'contribution', tier: 'silver', criteria: { type: 'messages_sent', threshold: 500 }, xpReward: 30 },
    { name: 'Event Explorer', description: 'Attended 5 events', icon: '🎪', category: 'participation', tier: 'bronze', criteria: { type: 'events_attended', threshold: 5 }, xpReward: 15 },
    { name: 'Event Regular', description: 'Attended 20 events', icon: '🎯', category: 'participation', tier: 'silver', criteria: { type: 'events_attended', threshold: 20 }, xpReward: 40 },
    { name: 'Week Warrior', description: '7-day activity streak', icon: '🔥', category: 'streak', tier: 'bronze', criteria: { type: 'streak_days', threshold: 7 }, xpReward: 20 },
    { name: 'Month Master', description: '30-day activity streak', icon: '🌟', category: 'streak', tier: 'silver', criteria: { type: 'streak_days', threshold: 30 }, xpReward: 75 },
    { name: 'Streak Legend', description: '100-day activity streak', icon: '👑', category: 'streak', tier: 'gold', criteria: { type: 'streak_days', threshold: 100 }, xpReward: 200 },
    { name: 'Helpful Hand', description: 'Received 10 helpful votes', icon: '🤝', category: 'contribution', tier: 'bronze', criteria: { type: 'helpful_answers', threshold: 10 }, xpReward: 20 },
    { name: 'Mentor', description: 'Received 50 helpful votes', icon: '🎓', category: 'contribution', tier: 'silver', criteria: { type: 'helpful_answers', threshold: 50 }, xpReward: 60 },
    { name: 'Doubt Destroyer', description: 'Resolved 25 doubts', icon: '💡', category: 'contribution', tier: 'silver', criteria: { type: 'doubts_resolved', threshold: 25 }, xpReward: 50 },
    { name: 'Contest Champion', description: 'Won 3 contests', icon: '🏆', category: 'performance', tier: 'gold', criteria: { type: 'contest_wins', threshold: 3 }, xpReward: 100 },
  ];

  await this.insertMany(defaults.map(b => ({ ...b, isGlobal: true })));
};

module.exports = mongoose.model('SocietyBadge', societyBadgeSchema);
