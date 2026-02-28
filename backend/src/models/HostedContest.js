const mongoose = require('mongoose');

// Notification schema for contest announcements
const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'urgent'], default: 'info' },
  sentAt: { type: Date, default: Date.now },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Signup schema to track participants
const signupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  signedUpAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['registered', 'participated', 'disqualified'], default: 'registered' }
});

const hostedContestSchema = new mongoose.Schema({
  // Basic Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  tagline: {
    type: String,
    maxlength: 100,
    default: ''
  },
  
  // Timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  hasNoEndTime: {
    type: Boolean,
    default: false
  },
  timezone: {
    type: String,
    default: 'IST'
  },
  
  // Organization
  organizationType: {
    type: String,
    enum: ['personal', 'college', 'company', 'non-profit', 'community'],
    default: 'personal'
  },
  organizationName: {
    type: String,
    default: ''
  },
  
  // Landing Page Customization
  backgroundImage: {
    type: String,
    default: ''
  },
  useAsOpenGraphImage: {
    type: Boolean,
    default: false
  },
  rules: {
    type: String,
    default: ''
  },
  prizes: {
    type: String,
    default: ''
  },
  scoring: {
    type: String,
    default: `- Each challenge has a pre-determined score.
- A participant's score depends on the number of test cases a participant's code submission successfully passes.
- If a participant submits more than one solution per challenge, then the participant's score will reflect the highest score achieved.`
  },
  
  // Contest Format & Scoring Settings
  contestFormat: {
    type: String,
    enum: ['icpc', 'codeforces-div2', 'normal', 'custom'],
    default: 'normal'
  },
  
  // ICPC Style Settings
  icpcSettings: {
    penalty: { type: Number, default: 1200 }, // Penalty in seconds for wrong submission
    penalizeCompilationError: { type: Boolean, default: false },
    freezeLeaderboardAt: { type: Number, default: 0 } // Unix timestamp, 0 means no freeze
  },
  
  // Codeforces Div2 Style Settings
  cfSettings: {
    problemScores: [{ type: Number }], // Score for each problem
    scoreDecayEnabled: { type: Boolean, default: true },
    decayRate: { type: Number, default: 0.004 }, // Score decay per second
    minScorePercentage: { type: Number, default: 30 }, // Minimum score percentage
    hackEnabled: { type: Boolean, default: false }
  },
  
  // Normal Contest Settings
  normalSettings: {
    partialScoring: { type: Boolean, default: true },
    showTestCasesOnWrong: { type: Boolean, default: false },
    allowMultipleSubmissions: { type: Boolean, default: true }
  },
  
  // Leaderboard Configuration
  leaderboardType: {
    type: String,
    enum: ['acm', 'ioi', 'custom'],
    default: 'acm'
  },
  showLeaderboardDuringContest: {
    type: Boolean,
    default: true
  },
  
  // Forum Settings
  forumEnabled: {
    type: Boolean,
    default: true
  },
  restrictedForum: {
    type: Boolean,
    default: false
  },
  
  // Access Control
  isPublic: {
    type: Boolean,
    default: true
  },
  accessCode: {
    type: String,
    default: ''
  },
  allowedLanguages: [{
    type: String,
    enum: ['cpp20', 'java', 'python3', 'pypy3', 'c'],
    default: ['cpp20', 'java', 'python3', 'pypy3', 'c']
  }],
  
  // Security Features
  screenLockEnabled: {
    type: Boolean,
    default: false
  },
  tabSwitchLimit: {
    type: Number,
    default: 3
  },
  fullscreenRequired: {
    type: Boolean,
    default: false
  },
  copyPasteDisabled: {
    type: Boolean,
    default: false
  },
  
  // Problems/Challenges
  problems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContestProblem'
  }],
  
  // Owner & Moderators
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'moderator', 'viewer'], default: 'moderator' },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Participants & Signups
  signups: [signupSchema],
  maxParticipants: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  
  // Notifications
  notifications: [notificationSchema],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'live', 'ended', 'cancelled'],
    default: 'draft'
  },
  
  // Statistics (updated after contest)
  statistics: {
    totalParticipants: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Generate unique slug before saving
hostedContestSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.model('HostedContest').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Update status based on time
hostedContestSchema.methods.updateStatus = function() {
  const now = new Date();
  if (this.status === 'cancelled') return this.status;
  
  if (now < this.startTime) {
    this.status = 'scheduled';
  } else if (now >= this.startTime && (this.hasNoEndTime || now < this.endTime)) {
    this.status = 'live';
  } else if (now >= this.endTime) {
    this.status = 'ended';
  }
  
  return this.status;
};

// Check if user is moderator
hostedContestSchema.methods.isModerator = function(userId) {
  return this.owner.equals(userId) || 
         this.moderators.some(m => m.user.equals(userId));
};

// Check if user can edit
hostedContestSchema.methods.canEdit = function(userId) {
  if (this.owner.equals(userId)) return true;
  const mod = this.moderators.find(m => m.user.equals(userId));
  return mod && ['admin'].includes(mod.role);
};

// Indexes (slug already indexed via unique:true)
hostedContestSchema.index({ owner: 1 });
hostedContestSchema.index({ status: 1, startTime: 1 });
hostedContestSchema.index({ 'signups.user': 1 });

module.exports = mongoose.model('HostedContest', hostedContestSchema);
