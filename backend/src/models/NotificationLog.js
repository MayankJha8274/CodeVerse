const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    required: true
  },
  type: {
    type: String,
    enum: ['contest-reminder'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to prevent duplicate notifications for the same user and contest
notificationLogSchema.index({ userId: 1, contestId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
