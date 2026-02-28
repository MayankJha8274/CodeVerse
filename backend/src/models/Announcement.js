const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    url: { type: String },
    filename: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }],
  taggedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    emoji: { type: String },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

announcementSchema.index({ society: 1, createdAt: -1 });
announcementSchema.index({ society: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ society: 1, isScheduled: 1, scheduledAt: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
