const mongoose = require('mongoose');

const societyStreakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  streakFreezes: {
    available: { type: Number, default: 1 },
    used: { type: Number, default: 0 },
    lastUsed: { type: Date, default: null }
  },
  totalActiveDays: {
    type: Number,
    default: 0
  },
  activityLog: [{
    date: { type: Date },
    activities: [{
      type: { type: String, enum: ['message', 'problem_solved', 'event_attended', 'doubt_resolved', 'login'] },
      count: { type: Number, default: 1 }
    }]
  }]
}, {
  timestamps: true
});

societyStreakSchema.index({ user: 1, society: 1 }, { unique: true });
societyStreakSchema.index({ society: 1, currentStreak: -1 });
societyStreakSchema.index({ society: 1, longestStreak: -1 });

// Record daily activity
societyStreakSchema.methods.recordActivity = async function(activityType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = this.lastActivityDate ? new Date(this.lastActivityDate) : null;
  if (lastActivity) lastActivity.setHours(0, 0, 0, 0);

  // Check if already recorded today
  const todayLog = this.activityLog.find(l => {
    const d = new Date(l.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (todayLog) {
    const existing = todayLog.activities.find(a => a.type === activityType);
    if (existing) existing.count += 1;
    else todayLog.activities.push({ type: activityType, count: 1 });
  } else {
    // Keep only last 90 days of activity log
    if (this.activityLog.length > 90) {
      this.activityLog = this.activityLog.slice(-89);
    }
    this.activityLog.push({ date: today, activities: [{ type: activityType, count: 1 }] });
  }

  // Update streak
  if (!lastActivity || lastActivity.getTime() !== today.getTime()) {
    if (lastActivity) {
      const diffDays = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        this.currentStreak += 1;
      } else if (diffDays === 2 && this.streakFreezes.available > 0) {
        // Use streak freeze
        this.streakFreezes.available -= 1;
        this.streakFreezes.used += 1;
        this.streakFreezes.lastUsed = new Date();
        this.currentStreak += 1;
      } else if (diffDays > 1) {
        this.currentStreak = 1;
      }
    } else {
      this.currentStreak = 1;
    }

    this.totalActiveDays += 1;
    this.lastActivityDate = today;

    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }
  }

  await this.save();
  return this;
};

module.exports = mongoose.model('SocietyStreak', societyStreakSchema);
