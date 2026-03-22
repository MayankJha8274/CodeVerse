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
    enum: ['24h', '6h'],
    required: true
  },
  sent: {
    type: Boolean,
    default: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index to prevent duplicate emails for the same user, contest, and reminder type
notificationLogSchema.index({ userId: 1, contestId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
