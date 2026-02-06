const mongoose = require('mongoose');

const sheetProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sheetId: {
    type: String,
    required: true
  },
  problemId: {
    type: String,
    required: true
  },
  topicIndex: {
    type: Number,
    required: true
  },
  problemIndex: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['unsolved', 'attempted', 'solved'],
    default: 'unsolved'
  },
  notes: {
    type: String,
    default: ''
  },
  revision: {
    type: Boolean,
    default: false
  },
  solvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
sheetProgressSchema.index({ user: 1, sheetId: 1, problemId: 1 }, { unique: true });
sheetProgressSchema.index({ user: 1, sheetId: 1 });

module.exports = mongoose.model('SheetProgress', sheetProgressSchema);
