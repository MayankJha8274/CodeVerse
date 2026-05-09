const mongoose = require('mongoose');

const emailJobSchema = new mongoose.Schema({
  // Optional idempotency key (e.g. cron jobId). Only set when provided.
  // Must be omitted/undefined when not used; do not default to null.
  jobKey: { type: String },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  html: { type: String, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
  status: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
  nextAttemptAt: { type: Date, default: Date.now },
}, { timestamps: true });

emailJobSchema.index({ status: 1, nextAttemptAt: 1 });
emailJobSchema.index({ jobKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('EmailJob', emailJobSchema);
