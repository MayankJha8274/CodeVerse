const mongoose = require('mongoose');
const slugify = require('slugify');

const ProblemSetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  problemCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Problem description is required']
  },
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  sampleInput: String,
  sampleOutput: String,
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Test cases
  testCases: [{
    input: String,
    expectedOutput: String,
    isSample: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: true },
    points: { type: Number, default: 10 },
    explanation: String
  }],
  // Scoring
  maxScore: {
    type: Number,
    default: 100
  },
  // Execution limits
  timeLimit: {
    type: Number,
    default: 2 // seconds
  },
  memoryLimit: {
    type: Number,
    default: 256 // MB
  },
  // Allowed languages
  allowedLanguages: [{
    type: String,
    enum: ['cpp20', 'c', 'java', 'python3', 'pypy3']
  }],
  // Checker type
  checkerType: {
    type: String,
    enum: ['exact', 'token', 'float', 'custom'],
    default: 'exact'
  },
  customChecker: String,
  // Hints and editorial
  hints: [String],
  editorial: String,
  // Ownership and permissions
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'editor'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Visibility
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'private'
  },
  // Stats
  stats: {
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    usedInContests: { type: Number, default: 0 }
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug before saving
ProblemSetSchema.pre('save', async function() {
  if (!this.isModified('title')) return;
  
  const baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  
  while (await mongoose.models.ProblemSet.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  this.slug = slug;
});

// Update timestamp
ProblemSetSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Virtual for acceptance rate
ProblemSetSchema.virtual('acceptanceRate').get(function() {
  if (this.stats.totalSubmissions === 0) return 0;
  return ((this.stats.acceptedSubmissions / this.stats.totalSubmissions) * 100).toFixed(1);
});

// Ensure virtuals are included
ProblemSetSchema.set('toJSON', { virtuals: true });
ProblemSetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ProblemSet', ProblemSetSchema);
