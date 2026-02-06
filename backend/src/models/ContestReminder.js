const mongoose = require('mongoose');

const contestReminderSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: Date, // When to send the reminder (16 hours before contest)
    required: true
  },
  contestDetails: {
    name: String,
    platform: String,
    url: String,
    startTime: Date,
    duration: Number
  }
}, {
  timestamps: true
});

// Index for efficient querying reminders to send
contestReminderSchema.index({ reminderSent: 1, reminderTime: 1 });
contestReminderSchema.index({ userId: 1, contestId: 1 }, { unique: true });

module.exports = mongoose.model('ContestReminder', contestReminderSchema);
