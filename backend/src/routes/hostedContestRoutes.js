const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/redisCache');
const { cacheMiddleware } = require('../middleware/cache');

const hostedContestController = require('../controllers/hostedContestController');
const contestProblemController = require('../controllers/contestProblemController');
const submissionController = require('../controllers/submissionController');

// ============== CONTEST ROUTES ==============

// Public routes
router.get('/public', cacheMiddleware(60), cacheResponse(300), hostedContestController.getPublicContests);

// Protected routes (must come BEFORE :slug to prevent capture)
router.use(protect);

// My contests - MUST be before /:slug
router.get('/my-contests', cacheResponse(60), hostedContestController.getMyContests);

// Contest management
router.post('/', hostedContestController.createContest);
router.get('/:slug', optionalAuth, cacheResponse(60), hostedContestController.getContest);
router.get('/:slug/notifications', cacheResponse(60), hostedContestController.getNotifications);
router.get('/:slug/leaderboard', optionalAuth, cacheMiddleware(120), cacheResponse(60), submissionController.getLeaderboard);
router.put('/:slug', hostedContestController.updateContest);
router.delete('/:slug', hostedContestController.deleteContest);

// Moderators
router.post('/:slug/moderators', hostedContestController.addModerator);
router.delete('/:slug/moderators/:userId', hostedContestController.removeModerator);

// Notifications
router.post('/:slug/notifications', hostedContestController.sendNotification);

// Signups
router.post('/:slug/signup', hostedContestController.signUp);
router.get('/:slug/signups', cacheResponse(30), hostedContestController.getSignups);

// Statistics
router.get('/:slug/statistics', cacheResponse(120), hostedContestController.getStatistics);

// ============== PROBLEM ROUTES ==============

// Get problems (public during contest)
router.get('/:slug/problems', optionalAuth, cacheResponse(60), contestProblemController.getProblems);
router.get('/:slug/problems/:problemSlug', optionalAuth, cacheResponse(60), contestProblemController.getProblem);

// Problem management (admin only)
router.post('/:slug/problems', contestProblemController.createProblem);
router.put('/:slug/problems/reorder', contestProblemController.reorderProblems);
router.put('/:slug/problems/:problemSlug', contestProblemController.updateProblem);
router.delete('/:slug/problems/:problemSlug', contestProblemController.deleteProblem);

// Test cases
router.post('/:slug/problems/:problemSlug/testcases', contestProblemController.addTestCase);
router.delete('/:slug/problems/:problemSlug/testcases/:testCaseId', contestProblemController.deleteTestCase);

// ============== SUBMISSION ROUTES ==============

// Submit solution
router.post('/:slug/problems/:problemSlug/submit', submissionController.submitSolution);

// Get submissions
router.get('/:slug/problems/:problemSlug/submissions', cacheResponse(30), submissionController.getProblemSubmissions);
router.get('/:slug/my-submissions', cacheResponse(30), submissionController.getMySubmissions);

module.exports = router;