const mongoose = require('mongoose');

// Individual test case result
const testCaseResultSchema = new mongoose.Schema({
  testCaseIndex: { type: Number, required: true },
  passed: { type: Boolean, default: false },
  executionTime: { type: Number, default: 0 }, // in ms
  memoryUsed: { type: Number, default: 0 }, // in MB
  status: {
    type: String,
    enum: ['passed', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compilation_error', 'pending'],
    default: 'pending'
  },
  output: { type: String, default: '' }, // Actual output (only stored for sample test cases)
  error: { type: String, default: '' }
});

const contestSubmissionSchema = new mongoose.Schema({
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostedContest',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContestProblem',
    required: true
  },
  
  // Submission Details
  language: {
    type: String,
    enum: ['cpp20', 'java', 'python3', 'pypy3', 'c'],
    required: true
  },
  code: {
    type: String,
    required: true,
    maxlength: 65536 // 64KB max code size
  },
  
  // Submission Time
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  // Execution Results
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'partial', 'time_limit', 'memory_limit', 'runtime_error', 'compilation_error', 'internal_error'],
    default: 'pending'
  },
  
  // Test Case Results
  testCaseResults: [testCaseResultSchema],
  
  // Scoring
  score: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 100
  },
  
  // For CF-style scoring
  cfScore: {
    type: Number,
    default: 0
  },
  
  // Execution Statistics
  totalExecutionTime: {
    type: Number,
    default: 0
  },
  maxMemoryUsed: {
    type: Number,
    default: 0
  },
  
  // Compilation
  compilationOutput: {
    type: String,
    default: ''
  },
  compilationError: {
    type: String,
    default: ''
  },
  
  // Meta
  testCasesPassed: {
    type: Number,
    default: 0
  },
  totalTestCases: {
    type: Number,
    default: 0
  },
  
  // For ICPC-style tracking
  isFirstAccepted: {
    type: Boolean,
    default: false
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  
  // IP tracking for anti-cheat
  ipAddress: {
    type: String,
    default: ''
  },
  
  // Tab switch tracking
  tabSwitchCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update problem statistics on save
contestSubmissionSchema.post('save', async function() {
  if (this.status === 'accepted' || this.status === 'partial' || this.status === 'wrong_answer') {
    const ContestProblem = mongoose.model('ContestProblem');
    await ContestProblem.findByIdAndUpdate(this.problem, {
      $inc: { 
        'statistics.totalSubmissions': 1,
        ...(this.status === 'accepted' && { 'statistics.acceptedSubmissions': 1 })
      }
    });
    
    // Check if this is first solve
    if (this.status === 'accepted') {
      const problem = await ContestProblem.findById(this.problem);
      if (problem && !problem.statistics.firstSolve?.user) {
        problem.statistics.firstSolve = {
          user: this.user,
          time: this.submittedAt
        };
        await problem.save();
      }
    }
  }
});

// Indexes for efficient queries
contestSubmissionSchema.index({ user: 1, contest: 1, problem: 1 });
contestSubmissionSchema.index({ contest: 1, problem: 1, status: 1 });
contestSubmissionSchema.index({ contest: 1, submittedAt: -1 });
contestSubmissionSchema.index({ user: 1, problem: 1, status: 1 });

module.exports = mongoose.model('ContestSubmission', contestSubmissionSchema);
