const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['leetcode', 'codeforces', 'codechef', 'atcoder', 'hackerrank', 'hackerearth']
  },
  url: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in minutes
    default: 0
  },
  contestId: {
    type: String, // Platform-specific ID
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
contestSchema.index({ platform: 1, startTime: 1 });
contestSchema.index({ contestId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('Contest', contestSchema);
