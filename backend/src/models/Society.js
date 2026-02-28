const mongoose = require('mongoose');
const crypto = require('crypto');

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Society name is required'],
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex').toUpperCase()
  },
  settings: {
    isPrivate: { type: Boolean, default: false },
    maxMembers: { type: Number, default: 500 },
    allowMemberInvite: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    enableChat: { type: Boolean, default: true },
    enableEvents: { type: Boolean, default: true },
    enableLeaderboard: { type: Boolean, default: true }
  },
  stats: {
    totalMembers: { type: Number, default: 1 },
    activeMembers: { type: Number, default: 1 },
    totalMessages: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    weeklyActive: { type: Number, default: 0 }
  },
  tags: [{ type: String, trim: true }],
  institution: { type: String, trim: true, default: '' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes (slug and inviteCode already indexed via unique:true)
societySchema.index({ owner: 1 });
societySchema.index({ 'stats.totalMembers': -1 });
societySchema.index({ isActive: 1, isVerified: 1 });

// Auto-generate slug
societySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + crypto.randomBytes(2).toString('hex');
  }
  next();
});

module.exports = mongoose.model('Society', societySchema);
