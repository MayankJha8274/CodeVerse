const ContestSubmission = require('../models/ContestSubmission');
const ContestProblem = require('../models/ContestProblem');
const HostedContest = require('../models/HostedContest');
const codeExecutionService = require('../services/codeExecutionService');

// ============== SUBMISSIONS ==============

// @desc    Submit solution for a problem
// @route   POST /api/hosted-contests/:slug/problems/:problemSlug/submit
// @access  Private
exports.submitSolution = async (req, res) => {
  try {
    const { code, language } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    // Get contest
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    contest.updateStatus();

    // Check if contest is live
    const isModerator = contest.isModerator(req.user._id);
    if (contest.status !== 'live' && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'Contest is not currently active'
      });
    }

    // Check if user is signed up
    const isSignedUp = contest.signups.some(s => s.user.equals(req.user._id));
    if (!isSignedUp && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'You must register for the contest first'
      });
    }

    // Check if language is allowed
    if (!contest.allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Language ${language} is not allowed for this contest`
      });
    }

    // Get problem
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

    // Check problem-specific language restrictions
    if (problem.allowedLanguages?.length > 0 && !problem.allowedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        error: `Language ${language} is not allowed for this problem`
      });
    }

    // Count previous attempts
    const previousAttempts = await ContestSubmission.countDocuments({
      user: req.user._id,
      problem: problem._id,
      contest: contest._id
    });

    // Create submission record
    const submission = new ContestSubmission({
      user: req.user._id,
      contest: contest._id,
      problem: problem._id,
      language,
      code,
      status: 'pending',
      attemptNumber: previousAttempts + 1,
      maxPossibleScore: problem.maxScore,
      totalTestCases: problem.testCases.length,
      ipAddress: req.ip
    });

    await submission.save();

    // Send immediate response
    res.status(202).json({
      success: true,
      message: 'Submission received, processing...',
      submissionId: submission._id
    });

    // Execute code asynchronously
    executeSubmission(submission, problem, contest).catch(err => {
      console.error('Submission execution error:', err);
    });

  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Execute submission asynchronously
async function executeSubmission(submission, problem, contest) {
  try {
    submission.status = 'running';
    await submission.save();

    // Get language-specific time/memory limits
    const langLimits = problem.languageLimits?.[submission.language] || { timeMultiplier: 1, memoryMultiplier: 1 };
    const timeLimit = problem.timeLimit * langLimits.timeMultiplier;
    const memoryLimit = problem.memoryLimit * langLimits.memoryMultiplier;

    // Execute code
    const result = await codeExecutionService.executeCode(
      submission.code,
      submission.language,
      problem.testCases,
      timeLimit,
      memoryLimit
    );

    // Update submission with results
    if (!result.success) {
      submission.status = result.status || 'internal_error';
      submission.compilationError = result.compilationError || result.error || '';
    } else {
      submission.status = result.status;
      submission.testCaseResults = result.testCaseResults;
      submission.testCasesPassed = result.testCasesPassed;
      submission.totalExecutionTime = result.totalExecutionTime;
      submission.maxMemoryUsed = result.maxMemoryUsed;

      // Calculate score
      if (problem.partialScoring) {
        submission.score = Math.round((result.testCasesPassed / result.totalTestCases) * problem.maxScore);
      } else {
        submission.score = result.status === 'accepted' ? problem.maxScore : 0;
      }

      // Calculate CF-style score if applicable
      if (contest.contestFormat === 'codeforces-div2') {
        const contestElapsed = (Date.now() - contest.startTime.getTime()) / 1000; // seconds
        const cfSettings = problem.cfScoreSettings || { initialScore: 500, decayEnabled: true, minScore: 100 };
        
        if (result.status === 'accepted') {
          let cfScore = cfSettings.initialScore;
          if (cfSettings.decayEnabled) {
            cfScore = Math.max(
              cfSettings.minScore,
              cfSettings.initialScore - Math.floor(contestElapsed * (contest.cfSettings?.decayRate || 0.004))
            );
          }
          // Penalty for wrong submissions
          const wrongPenalty = (submission.attemptNumber - 1) * 50;
          submission.cfScore = Math.max(cfSettings.minScore, cfScore - wrongPenalty);
        }
      }
    }

    // Check if this is first accepted for the problem
    if (submission.status === 'accepted') {
      const existingAccepted = await ContestSubmission.findOne({
        problem: problem._id,
        user: submission.user,
        status: 'accepted',
        _id: { $ne: submission._id }
      });
      
      submission.isFirstAccepted = !existingAccepted;
    }

    await submission.save();

  } catch (error) {
    console.error('Execute submission error:', error);
    submission.status = 'internal_error';
    submission.compilationError = error.message;
    await submission.save();
  }
}

// @desc    Get submission status
// @route   GET /api/submissions/:submissionId
// @access  Private
exports.getSubmission = async (req, res) => {
  try {
    const submission = await ContestSubmission.findById(req.params.submissionId)
      .populate('problem', 'title problemCode maxScore')
      .populate('user', 'name username');

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check access
    const contest = await HostedContest.findById(submission.contest);
    const isModerator = contest && contest.isModerator(req.user._id);
    const isOwner = submission.user._id.equals(req.user._id);

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this submission'
      });
    }

    // Prepare response
    const responseData = submission.toObject();

    // Hide test case details for hidden test cases (unless moderator)
    if (!isModerator) {
      responseData.testCaseResults = responseData.testCaseResults?.map(tc => ({
        testCaseIndex: tc.testCaseIndex,
        passed: tc.passed,
        status: tc.status,
        executionTime: tc.executionTime,
        isSample: tc.isSample,
        // Only show output for sample test cases
        output: tc.isSample ? tc.output : undefined,
        error: tc.isSample ? tc.error : undefined
      }));
    }

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all submissions for a problem
// @route   GET /api/hosted-contests/:slug/problems/:problemSlug/submissions
// @access  Private
exports.getProblemSubmissions = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
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

    const isModerator = contest.isModerator(req.user._id);

    // Build query
    let query = { problem: problem._id };
    
    // Non-moderators can only see their own submissions
    if (!isModerator) {
      query.user = req.user._id;
    }

    const submissions = await ContestSubmission.find(query)
      .populate('user', 'name username')
      .select('-code -testCaseResults -compilationError')
      .sort({ submittedAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get problem submissions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get user's submissions in a contest
// @route   GET /api/hosted-contests/:slug/my-submissions
// @access  Private
exports.getMySubmissions = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    const submissions = await ContestSubmission.find({
      contest: contest._id,
      user: req.user._id
    })
    .populate('problem', 'title problemCode maxScore')
    .select('-testCaseResults')
    .sort({ submittedAt: -1 });

    res.json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Run code (live compiler - no submission)
// @route   POST /api/run-code
// @access  Private
exports.runCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    const result = await codeExecutionService.runSnippet(code, language, input || '', 5000);

    res.json({
      success: result.success,
      output: result.output,
      error: result.error,
      isCompilationError: result.isCompilationError,
      executionTime: result.executionTime,
      status: result.status
    });
  } catch (error) {
    console.error('Run code error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get leaderboard for contest
// @route   GET /api/hosted-contests/:slug/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const contest = await HostedContest.findOne({ slug: req.params.slug });
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    contest.updateStatus();

    // Check if leaderboard should be shown
    if (!contest.showLeaderboardDuringContest && contest.status === 'live') {
      const isModerator = req.user && contest.isModerator(req.user._id);
      if (!isModerator) {
        return res.status(403).json({
          success: false,
          error: 'Leaderboard is hidden during the contest'
        });
      }
    }

    // Get all problems
    const problems = await ContestProblem.find({ contest: contest._id })
      .select('_id problemCode maxScore')
      .sort({ order: 1 });

    // Aggregate submissions to build leaderboard
    const leaderboardData = await ContestSubmission.aggregate([
      { $match: { contest: contest._id } },
      {
        $group: {
          _id: { user: '$user', problem: '$problem' },
          bestScore: { $max: '$score' },
          attempts: { $sum: 1 },
          firstAcceptedTime: {
            $min: {
              $cond: [{ $eq: ['$status', 'accepted'] }, '$submittedAt', null]
            }
          },
          solved: {
            $max: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          cfScore: { $max: '$cfScore' }
        }
      },
      {
        $group: {
          _id: '$_id.user',
          problems: {
            $push: {
              problem: '$_id.problem',
              score: '$bestScore',
              attempts: '$attempts',
              firstAcceptedTime: '$firstAcceptedTime',
              solved: '$solved',
              cfScore: '$cfScore'
            }
          },
          totalScore: { $sum: '$bestScore' },
          totalSolved: { $sum: '$solved' },
          totalCfScore: { $sum: '$cfScore' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          user: { _id: 1, name: 1, username: 1 },
          problems: 1,
          totalScore: 1,
          totalSolved: 1,
          totalCfScore: 1
        }
      },
      { $sort: { totalSolved: -1, totalScore: -1 } },
      { $limit: 100 }
    ]);

    // Calculate penalty for ICPC style
    if (contest.contestFormat === 'icpc') {
      for (const entry of leaderboardData) {
        let totalPenalty = 0;
        for (const prob of entry.problems) {
          if (prob.solved) {
            const solveTime = Math.floor((new Date(prob.firstAcceptedTime) - contest.startTime) / 60000); // minutes
            const wrongAttemptPenalty = (prob.attempts - 1) * (contest.icpcSettings?.penalty / 60 || 20); // penalty in minutes
            totalPenalty += solveTime + wrongAttemptPenalty;
          }
        }
        entry.penalty = totalPenalty;
      }
      // Re-sort by solved count (desc), then penalty (asc)
      leaderboardData.sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        return a.penalty - b.penalty;
      });
    }

    // Add ranks
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      contestFormat: contest.contestFormat,
      problems: problems.map(p => ({ _id: p._id, code: p.problemCode, maxScore: p.maxScore })),
      data: leaderboardData
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
