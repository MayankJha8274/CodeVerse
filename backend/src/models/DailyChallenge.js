const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true
  },
  problemName: {
    type: String,
    required: true
  },
  problemLink: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  sheetId: {
    type: String,
    default: null
  },
  topicIndex: {
    type: Number,
    default: null
  },
  problemIndex: {
    type: Number,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
dailyChallengeSchema.index({ user: 1, date: 1 }, { unique: true });

const streakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastCompletedDate: {
    type: String, // Format: YYYY-MM-DD
    default: null
  },
  totalCompleted: {
    type: Number,
    default: 0
  },
  completionHistory: [{
    date: String,
    problemName: String,
    topic: String
  }]
}, {
  timestamps: true
});

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);
const Streak = mongoose.model('Streak', streakSchema);

module.exports = { DailyChallenge, Streak };
