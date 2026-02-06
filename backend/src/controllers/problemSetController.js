const ProblemSet = require('../models/ProblemSet');
const User = require('../models/User');

// ============== PROBLEM SET MANAGEMENT ==============

// @desc    Create a new problem
// @route   POST /api/problem-set
// @access  Private
exports.createProblem = async (req, res) => {
  try {
    const {
      title,
      problemCode,
      description,
      inputFormat,
      outputFormat,
      constraints,
      sampleInput,
      sampleOutput,
      explanation,
      difficulty,
      tags,
      maxScore,
      timeLimit,
      memoryLimit,
      allowedLanguages,
      checkerType,
      hints,
      editorial,
      visibility
    } = req.body;

    const problem = new ProblemSet({
      title,
      problemCode: problemCode || 'P',
      description,
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      constraints: constraints || '',
      sampleInput: sampleInput || '',
      sampleOutput: sampleOutput || '',
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      tags: tags || [],
      maxScore: maxScore || 100,
      timeLimit: timeLimit || 2,
      memoryLimit: memoryLimit || 256,
      allowedLanguages: allowedLanguages || ['cpp20', 'java', 'python3', 'pypy3', 'c'],
      checkerType: checkerType || 'exact',
      hints: hints || [],
      editorial: editorial || '',
      visibility: visibility || 'private',
      owner: req.user._id
    });

    await problem.save();

    res.status(201).json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all public problems
// @route   GET /api/problem-set/public
// @access  Public
exports.getPublicProblems = async (req, res) => {
  try {
    const { difficulty, tags, search, page = 1, limit = 20 } = req.query;
    
    const query = { visibility: 'public' };
    
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { problemCode: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const problems = await ProblemSet.find(query)
      .select('title slug problemCode difficulty tags stats maxScore owner createdAt')
      .populate('owner', 'username name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ProblemSet.countDocuments(query);
    
    res.json({
      success: true,
      data: problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get public problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get my problems (owned + moderated)
// @route   GET /api/problem-set/my-problems
// @access  Private
exports.getMyProblems = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const problems = await ProblemSet.find({
      $or: [
        { owner: userId },
        { 'moderators.user': userId }
      ]
    })
      .select('title slug problemCode difficulty visibility tags stats maxScore createdAt updatedAt')
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: problems
    });
  } catch (error) {
    console.error('Get my problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single problem
// @route   GET /api/problem-set/:slug
// @access  Private/Public based on visibility
exports.getProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await ProblemSet.findOne({ slug })
      .populate('owner', 'username name avatar')
      .populate('moderators.user', 'username name avatar');
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Check access
    if (problem.visibility === 'private') {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      const isOwner = problem.owner._id.toString() === req.user._id.toString();
      const isModerator = problem.moderators.some(m => m.user._id.toString() === req.user._id.toString());
      
      if (!isOwner && !isModerator) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update problem
// @route   PUT /api/problem-set/:slug
// @access  Private (owner/moderator)
exports.updateProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Check permission
    const isOwner = problem.owner.toString() === req.user._id.toString();
    const isModerator = problem.moderators.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'editor'
    );
    
    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this problem'
      });
    }
    
    const allowedUpdates = [
      'title', 'problemCode', 'description', 'inputFormat', 'outputFormat',
      'constraints', 'sampleInput', 'sampleOutput', 'explanation', 'difficulty',
      'tags', 'maxScore', 'timeLimit', 'memoryLimit', 'allowedLanguages',
      'checkerType', 'customChecker', 'hints', 'editorial', 'visibility'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        problem[field] = req.body[field];
      }
    });
    
    await problem.save();
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete problem
// @route   DELETE /api/problem-set/:slug
// @access  Private (owner only)
exports.deleteProblem = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Only owner can delete
    if (problem.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can delete this problem'
      });
    }
    
    await problem.deleteOne();
    
    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add moderator
// @route   POST /api/problem-set/:slug/moderators
// @access  Private (owner only)
exports.addModerator = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userIdentifier, role = 'editor' } = req.body;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    if (problem.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can add moderators'
      });
    }
    
    // Find user
    const user = await User.findOne({
      $or: [
        { email: userIdentifier },
        { username: userIdentifier }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if already moderator
    const exists = problem.moderators.some(m => m.user.toString() === user._id.toString());
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'User is already a moderator'
      });
    }
    
    problem.moderators.push({ user: user._id, role });
    await problem.save();
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Add moderator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Remove moderator
// @route   DELETE /api/problem-set/:slug/moderators/:userId
// @access  Private (owner only)
exports.removeModerator = async (req, res) => {
  try {
    const { slug, userId } = req.params;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    if (problem.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can remove moderators'
      });
    }
    
    problem.moderators = problem.moderators.filter(m => m.user.toString() !== userId);
    await problem.save();
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Remove moderator error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add test case
// @route   POST /api/problem-set/:slug/testcases
// @access  Private (owner/editor)
exports.addTestCase = async (req, res) => {
  try {
    const { slug } = req.params;
    const { input, expectedOutput, isSample, isHidden, points, explanation } = req.body;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Check permission
    const isOwner = problem.owner.toString() === req.user._id.toString();
    const isEditor = problem.moderators.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'editor'
    );
    
    if (!isOwner && !isEditor) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    problem.testCases.push({
      input: input || '',
      expectedOutput: expectedOutput || '',
      isSample: isSample || false,
      isHidden: isHidden !== false,
      points: points || 10,
      explanation: explanation || ''
    });
    
    await problem.save();
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Add test case error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete test case
// @route   DELETE /api/problem-set/:slug/testcases/:testCaseId
// @access  Private (owner/editor)
exports.deleteTestCase = async (req, res) => {
  try {
    const { slug, testCaseId } = req.params;
    
    const problem = await ProblemSet.findOne({ slug });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }
    
    // Check permission
    const isOwner = problem.owner.toString() === req.user._id.toString();
    const isEditor = problem.moderators.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'editor'
    );
    
    if (!isOwner && !isEditor) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    problem.testCases = problem.testCases.filter(tc => tc._id.toString() !== testCaseId);
    await problem.save();
    
    res.json({
      success: true,
      data: problem
    });
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Search problems for contest (returns public + owned)
// @route   GET /api/problem-set/search
// @access  Private
exports.searchProblems = async (req, res) => {
  try {
    const { search, difficulty, limit = 20 } = req.query;
    const userId = req.user._id;
    
    const query = {
      $or: [
        { visibility: 'public' },
        { owner: userId },
        { 'moderators.user': userId }
      ]
    };
    
    if (search) {
      query.$and = [{
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { problemCode: { $regex: search, $options: 'i' } }
        ]
      }];
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    const problems = await ProblemSet.find(query)
      .select('title slug problemCode difficulty maxScore owner visibility')
      .populate('owner', 'username')
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: problems
    });
  } catch (error) {
    console.error('Search problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
