const ContestProblem = require('../models/ContestProblem');
const HostedContest = require('../models/HostedContest');
const ContestSubmission = require('../models/ContestSubmission');

// ============== PROBLEM MANAGEMENT ==============

// @desc    Create a new problem
// @route   POST /api/hosted-contests/:slug/problems
// @access  Private (owner/admin)
exports.createProblem = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add problems'
      });
    }

    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      sampleExplanation,
      difficulty,
      maxScore,
      timeLimit,
      memoryLimit,
      testCases,
      tags,
      problemCode,
      checkerType,
      partialScoring
    } = req.body;

    // Get the next order number
    const problemCount = await ContestProblem.countDocuments({ contest: contest._id });
    
    // Auto-generate problem code if not provided
    const code = problemCode || String.fromCharCode(65 + problemCount); // A, B, C, ...

    const problem = new ContestProblem({
      title,
      description: description || '',
      inputFormat: inputFormat || '',
      outputFormat: outputFormat || '',
      constraints: constraints || '',
      sampleExplanation: sampleExplanation || '',
      difficulty: difficulty || 'medium',
      maxScore: maxScore || 100,
      timeLimit: timeLimit || 2000,
      memoryLimit: memoryLimit || 256,
      testCases: testCases || [],
      tags: tags || [],
      problemCode: code,
      order: problemCount,
      checkerType: checkerType || 'token',
      partialScoring: partialScoring !== false,
      author: req.user._id,
      contest: contest._id
    });

    await problem.save();

    // Add to contest
    contest.problems.push(problem._id);
    await contest.save();

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

// @desc    Get all problems for a contest
// @route   GET /api/hosted-contests/:slug/problems
// @access  Public (limited info) / Private (full info for moderators)
exports.getProblems = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    contest.updateStatus();
    
    const isModerator = req.user && contest.isModerator(req.user._id);
    const isLive = contest.status === 'live';
    const hasEnded = contest.status === 'ended';

    // Only show problems if contest is live, ended, or user is moderator
    if (!isModerator && !isLive && !hasEnded) {
      return res.status(403).json({
        success: false,
        error: 'Problems will be visible when contest starts'
      });
    }

    let selectFields = 'title slug problemCode difficulty maxScore order tags statistics';
    
    if (isModerator) {
      selectFields = '-__v'; // All fields except __v
    }

    const problems = await ContestProblem.find({ contest: contest._id, isActive: true })
      .select(selectFields)
      .sort({ order: 1 });

    res.json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single problem
// @route   GET /api/hosted-contests/:slug/problems/:problemSlug
// @access  Public (during contest) / Private (before)
exports.getProblem = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    contest.updateStatus();
    
    const isModerator = req.user && contest.isModerator(req.user._id);
    const isLive = contest.status === 'live';
    const hasEnded = contest.status === 'ended';

    if (!isModerator && !isLive && !hasEnded) {
      return res.status(403).json({
        success: false,
        error: 'Problem will be visible when contest starts'
      });
    }

    const problem = await ContestProblem.findOne({
      contest: contest._id,
      $or: [
        { slug: req.params.problemSlug },
        { problemCode: req.params.problemSlug.toUpperCase() }
      ]
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Prepare response
    const responseData = problem.toObject();
    
    // Filter test cases for non-moderators
    if (!isModerator) {
      responseData.testCases = problem.testCases.filter(tc => tc.isSample);
      delete responseData.editorial;
      delete responseData.customChecker;
    }

    // Add user's submission status if logged in
    if (req.user) {
      const bestSubmission = await ContestSubmission.findOne({
        user: req.user._id,
        problem: problem._id,
        status: 'accepted'
      }).select('score submittedAt');

      responseData.userStatus = {
        solved: !!bestSubmission,
        bestSubmission: bestSubmission || null
      };
    }

    res.json({
      success: true,
      data: responseData,
      contest: {
        name: contest.name,
        slug: contest.slug,
        status: contest.status,
        startTime: contest.startTime,
        endTime: contest.endTime,
        allowedLanguages: contest.allowedLanguages
      }
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
// @route   PUT /api/hosted-contests/:slug/problems/:problemSlug
// @access  Private (owner/admin)
exports.updateProblem = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const problem = await ContestProblem.findOne({
      contest: contest._id,
      $or: [
        { slug: req.params.problemSlug },
        { problemCode: req.params.problemSlug.toUpperCase() }
      ]
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Updateable fields
    const updateableFields = [
      'title', 'description', 'inputFormat', 'outputFormat', 'constraints',
      'sampleExplanation', 'difficulty', 'maxScore', 'timeLimit', 'memoryLimit',
      'testCases', 'tags', 'problemCode', 'checkerType', 'floatPrecision',
      'customChecker', 'partialScoring', 'hints', 'editorial', 'languageLimits',
      'allowedLanguages', 'cfScoreSettings', 'isActive', 'order'
    ];

    updateableFields.forEach(field => {
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
// @route   DELETE /api/hosted-contests/:slug/problems/:problemSlug
// @access  Private (owner/admin)
exports.deleteProblem = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const problem = await ContestProblem.findOne({
      contest: contest._id,
      $or: [
        { slug: req.params.problemSlug },
        { problemCode: req.params.problemSlug.toUpperCase() }
      ]
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    // Remove from contest
    contest.problems = contest.problems.filter(p => !p.equals(problem._id));
    await contest.save();

    // Delete submissions for this problem
    await ContestSubmission.deleteMany({ problem: problem._id });

    // Delete problem
    await problem.deleteOne();

    // Reorder remaining problems
    const remainingProblems = await ContestProblem.find({ contest: contest._id }).sort({ order: 1 });
    for (let i = 0; i < remainingProblems.length; i++) {
      remainingProblems[i].order = i;
      remainingProblems[i].problemCode = String.fromCharCode(65 + i);
      await remainingProblems[i].save();
    }

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

// @desc    Reorder problems
// @route   PUT /api/hosted-contests/:slug/problems/reorder
// @access  Private (owner/admin)
exports.reorderProblems = async (req, res) => {
  try {
    const { problemOrders } = req.body; // Array of { problemId, order }
    
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (!contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    // Update each problem's order
    for (const item of problemOrders) {
      await ContestProblem.findByIdAndUpdate(item.problemId, {
        order: item.order,
        problemCode: String.fromCharCode(65 + item.order)
      });
    }

    res.json({
      success: true,
      message: 'Problems reordered successfully'
    });
  } catch (error) {
    console.error('Reorder problems error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Add test case to problem
// @route   POST /api/hosted-contests/:slug/problems/:problemSlug/testcases
// @access  Private (owner/admin)
exports.addTestCase = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest || !contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const problem = await ContestProblem.findOne({
      contest: contest._id,
      $or: [
        { slug: req.params.problemSlug },
        { problemCode: req.params.problemSlug.toUpperCase() }
      ]
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    const { input, expectedOutput, isSample, isHidden, points, timeLimit, memoryLimit } = req.body;

    problem.testCases.push({
      input,
      expectedOutput,
      isSample: isSample || false,
      isHidden: isHidden !== false,
      points: points || 0,
      timeLimit: timeLimit || 0,
      memoryLimit: memoryLimit || 0
    });

    await problem.save();

    res.json({
      success: true,
      data: problem.testCases[problem.testCases.length - 1]
    });
  } catch (error) {
    console.error('Add test case error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete test case from problem
// @route   DELETE /api/hosted-contests/:slug/problems/:problemSlug/testcases/:testCaseId
// @access  Private (owner/admin)
exports.deleteTestCase = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest || !contest.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    const problem = await ContestProblem.findOne({
      contest: contest._id,
      $or: [
        { slug: req.params.problemSlug },
        { problemCode: req.params.problemSlug.toUpperCase() }
      ]
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: 'Problem not found'
      });
    }

    problem.testCases = problem.testCases.filter(
      tc => !tc._id.equals(req.params.testCaseId)
    );

    await problem.save();

    res.json({
      success: true,
      message: 'Test case deleted'
    });
  } catch (error) {
    console.error('Delete test case error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
