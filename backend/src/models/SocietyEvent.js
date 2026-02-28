const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  society: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  mode: {
    type: String,
    enum: ['online', 'offline', 'hybrid'],
    default: 'online'
  },
  location: {
    type: String,
    default: ''
  },
  meetingLink: {
    type: String,
    default: ''
  },
  eventType: {
    type: String,
    enum: ['workshop', 'contest', 'hackathon', 'webinar', 'meetup', 'study_session', 'other'],
    default: 'other'
  },
  maxParticipants: {
    type: Number,
    default: 0 // 0 = unlimited
  },
  bannerImage: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // RSVP
  rsvps: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['going', 'maybe', 'not_going'], default: 'going' },
    rsvpAt: { type: Date, default: Date.now }
  }],
  // Attendance
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedInAt: { type: Date, default: Date.now }
  }],
  // Feedback
  feedback: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    submittedAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'published'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for event category
eventSchema.virtual('category').get(function() {
  const now = new Date();
  if (this.status === 'cancelled') return 'cancelled';
  if (now < this.startTime) return 'upcoming';
  if (now >= this.startTime && now <= this.endTime) return 'ongoing';
  return 'past';
});

eventSchema.virtual('rsvpCount').get(function() {
  return this.rsvps?.filter(r => r.status === 'going').length || 0;
});

eventSchema.virtual('avgRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return Math.round((sum / this.feedback.length) * 10) / 10;
});

// Indexes
eventSchema.index({ society: 1, startTime: -1 });
eventSchema.index({ society: 1, status: 1 });
eventSchema.index({ startTime: 1, endTime: 1 });
eventSchema.index({ eventType: 1 });

// Auto-generate slug
eventSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    const crypto = require('crypto');
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + crypto.randomBytes(2).toString('hex');
  }
  next();
});

module.exports = mongoose.model('SocietyEvent', eventSchema);
