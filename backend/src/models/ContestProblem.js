const mongoose = require('mongoose');

// Test case schema
const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isSample: {
    type: Boolean,
    default: false
  },
  isHidden: {
    type: Boolean,
    default: true
  },
  points: {
    type: Number,
    default: 0 // For partial scoring
  },
  timeLimit: {
    type: Number,
    default: 0 // 0 means use problem default
  },
  memoryLimit: {
    type: Number,
    default: 0 // 0 means use problem default
  }
});

// Editorial/Hint schema
const hintSchema = new mongoose.Schema({
  content: { type: String, required: true },
  unlockAfterWrongAttempts: { type: Number, default: 0 }, // 0 means always available
  penaltyPercentage: { type: Number, default: 0 } // Score reduction for using hint
});

const contestProblemSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Problem Statement (Markdown)
  description: {
    type: String,
    required: true,
    default: ''
  },
  
  // Input/Output Format (Markdown)
  inputFormat: {
    type: String,
    default: ''
  },
  outputFormat: {
    type: String,
    default: ''
  },
  
  // Constraints
  constraints: {
    type: String,
    default: ''
  },
  
  // Sample Explanation
  sampleExplanation: {
    type: String,
    default: ''
  },
  
  // Difficulty
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'medium'
  },
  
  // Scoring
  maxScore: {
    type: Number,
    default: 100
  },
  partialScoring: {
    type: Boolean,
    default: true
  },
  
  // For CF-style scoring
  cfScoreSettings: {
    initialScore: { type: Number, default: 500 },
    decayEnabled: { type: Boolean, default: true },
    minScore: { type: Number, default: 100 }
  },
  
  // Time & Memory Limits
  timeLimit: {
    type: Number,
    default: 2000 // in milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 256 // in MB
  },
  
  // Language-specific limits (optional overrides)
  languageLimits: {
    cpp20: { timeMultiplier: { type: Number, default: 1 }, memoryMultiplier: { type: Number, default: 1 } },
    java: { timeMultiplier: { type: Number, default: 2 }, memoryMultiplier: { type: Number, default: 2 } },
    python3: { timeMultiplier: { type: Number, default: 3 }, memoryMultiplier: { type: Number, default: 1.5 } },
    pypy3: { timeMultiplier: { type: Number, default: 2 }, memoryMultiplier: { type: Number, default: 2 } },
    c: { timeMultiplier: { type: Number, default: 1 }, memoryMultiplier: { type: Number, default: 1 } }
  },
  
  // Allowed languages (empty means all contest languages allowed)
  allowedLanguages: [{
    type: String,
    enum: ['cpp20', 'java', 'python3', 'pypy3', 'c']
  }],
  
  // Test Cases
  testCases: [testCaseSchema],
  
  // Hints & Editorial
  hints: [hintSchema],
  editorial: {
    content: { type: String, default: '' },
    showAfterContest: { type: Boolean, default: true },
    showAfterSolve: { type: Boolean, default: false }
  },
  
  // Tags/Topics
  tags: [{
    type: String,
    trim: true
  }],
  
  // Author Info
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contest Reference
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostedContest',
    required: true
  },
  
  // Problem Order in Contest
  order: {
    type: Number,
    default: 0
  },
  
  // Problem Code (like A, B, C or 1, 2, 3)
  problemCode: {
    type: String,
    default: 'A'
  },
  
  // Checker Type
  checkerType: {
    type: String,
    enum: ['exact', 'token', 'float', 'custom'],
    default: 'token'
  },
  floatPrecision: {
    type: Number,
    default: 6 // Decimal places for float comparison
  },
  customChecker: {
    type: String, // Custom checker code
    default: ''
  },
  
  // Statistics
  statistics: {
    totalSubmissions: { type: Number, default: 0 },
    acceptedSubmissions: { type: Number, default: 0 },
    firstSolve: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      time: { type: Date }
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate slug
contestProblemSchema.pre('save', async function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }
  next();
});

// Virtual for sample test cases
contestProblemSchema.virtual('sampleTestCases').get(function() {
  return this.testCases.filter(tc => tc.isSample);
});

// Virtual for hidden test cases count
contestProblemSchema.virtual('hiddenTestCasesCount').get(function() {
  return this.testCases.filter(tc => tc.isHidden).length;
});

// Indexes
contestProblemSchema.index({ contest: 1, order: 1 });
contestProblemSchema.index({ slug: 1, contest: 1 }, { unique: true });
contestProblemSchema.index({ author: 1 });
contestProblemSchema.index({ tags: 1 });

module.exports = mongoose.model('ContestProblem', contestProblemSchema);
