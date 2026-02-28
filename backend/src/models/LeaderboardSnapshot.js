const mongoose = require('mongoose');

const leaderboardSnapshotSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'alltime'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  rankings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rank: { type: Number },
    previousRank: { type: Number, default: null },
    rankChange: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    percentile: { type: Number, default: 0 },
    breakdown: {
      problemsSolved: { type: Number, default: 0 },
      contestScore: { type: Number, default: 0 },
      chatContribution: { type: Number, default: 0 },
      eventParticipation: { type: Number, default: 0 },
      helpfulness: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 }
    }
  }],
  totalParticipants: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

leaderboardSnapshotSchema.index({ society: 1, period: 1, date: -1 });
leaderboardSnapshotSchema.index({ society: 1, period: 1, 'rankings.user': 1 });

module.exports = mongoose.model('LeaderboardSnapshot', leaderboardSnapshotSchema);
