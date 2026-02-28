const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatChannel',
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  // Thread support
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  threadCount: {
    type: Number,
    default: 0
  },
  // Message type
  type: {
    type: String,
    enum: ['text', 'code', 'file', 'image', 'system'],
    default: 'text'
  },
  // Code block metadata
  codeLanguage: {
    type: String,
    default: ''
  },
  // File attachment
  attachment: {
    url: { type: String },
    filename: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  },
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Reactions
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  // Flags
  isPinned: {
    type: Boolean,
    default: false
  },
  isSolution: {
    type: Boolean,
    default: false
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  // Read receipts
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  // Reports
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    reportedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ society: 1, channel: 1, createdAt: -1 });
messageSchema.index({ parentMessage: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ society: 1, isPinned: 1 });
messageSchema.index({ society: 1, isSolution: 1 });
messageSchema.index({ content: 'text' });

module.exports = mongoose.model('Message', messageSchema);
