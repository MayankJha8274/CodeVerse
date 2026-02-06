const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');

const hostedContestController = require('../controllers/hostedContestController');
const contestProblemController = require('../controllers/contestProblemController');
const submissionController = require('../controllers/submissionController');

// ============== CONTEST ROUTES ==============

// Public routes
router.get('/public', hostedContestController.getPublicContests);
router.get('/:slug', optionalAuth, hostedContestController.getContest);
router.get('/:slug/notifications', hostedContestController.getNotifications);
router.get('/:slug/leaderboard', optionalAuth, submissionController.getLeaderboard);

// Protected routes
router.use(protect);

// Contest management
router.post('/', hostedContestController.createContest);
router.get('/my-contests', hostedContestController.getMyContests);
router.put('/:slug', hostedContestController.updateContest);
router.delete('/:slug', hostedContestController.deleteContest);

// Moderators
router.post('/:slug/moderators', hostedContestController.addModerator);
router.delete('/:slug/moderators/:userId', hostedContestController.removeModerator);

// Notifications
router.post('/:slug/notifications', hostedContestController.sendNotification);

// Signups
router.post('/:slug/signup', hostedContestController.signUp);
router.get('/:slug/signups', hostedContestController.getSignups);

// Statistics
router.get('/:slug/statistics', hostedContestController.getStatistics);

// ============== PROBLEM ROUTES ==============

// Get problems (public during contest)
router.get('/:slug/problems', optionalAuth, contestProblemController.getProblems);
router.get('/:slug/problems/:problemSlug', optionalAuth, contestProblemController.getProblem);

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
router.get('/:slug/problems/:problemSlug/submissions', submissionController.getProblemSubmissions);
router.get('/:slug/my-submissions', submissionController.getMySubmissions);

module.exports = router;
