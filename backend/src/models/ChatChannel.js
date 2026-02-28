const mongoose = require('mongoose');

const chatChannelSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  description: {
    type: String,
    default: '',
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['general', 'doubts', 'resources', 'announcements', 'custom'],
    default: 'custom'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isAdminOnly: {
    type: Boolean,
    default: false
  },
  isReadOnly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatChannelSchema.index({ society: 1, slug: 1 }, { unique: true });
chatChannelSchema.index({ society: 1, isActive: 1 });
chatChannelSchema.index({ society: 1, lastActivity: -1 });

// Create default channels for a society
chatChannelSchema.statics.createDefaults = async function(societyId, createdBy) {
  const defaults = [
    { name: 'General', slug: 'general', type: 'general', description: 'General discussion', isDefault: true },
    { name: 'Doubts', slug: 'doubts', type: 'doubts', description: 'Ask your coding doubts' },
    { name: 'Resources', slug: 'resources', type: 'resources', description: 'Share helpful resources' },
    { name: 'Announcements', slug: 'announcements', type: 'announcements', description: 'Important announcements', isAdminOnly: true }
  ];

  const channels = defaults.map(ch => ({
    ...ch,
    society: societyId,
    createdBy
  }));

  return this.insertMany(channels);
};

module.exports = mongoose.model('ChatChannel', chatChannelSchema);
