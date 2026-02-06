const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

/**
 * Analytics Routes
 * All routes require authentication
 */

// Aggregation & Progress Analytics
router.get('/streaks', protect, analyticsController.getStreaks);
router.get('/languages', protect, analyticsController.getLanguages);
router.get('/weekly-progress', protect, analyticsController.getWeeklyProgress);

// Rating Analytics
router.get('/rating-history/:platform', protect, analyticsController.getRatingHistory);
router.get('/all-rating-history', protect, analyticsController.getAllRatingHistory);
router.get('/rating-changes', protect, analyticsController.getRatingChanges);
router.get('/rating-prediction/:platform', protect, analyticsController.getRatingPrediction);
router.get('/contest-performance', protect, analyticsController.getContestPerformance);
router.get('/highest-rated', protect, analyticsController.getHighestRated);

// Insights & Recommendations
router.get('/weak-areas', protect, analyticsController.getWeakAreas);
router.get('/daily-goals', protect, analyticsController.getDailyGoals);
router.get('/similar-users', protect, analyticsController.getSimilarUsers);
router.get('/achievements', protect, analyticsController.getAchievements);
router.get('/insights', protect, analyticsController.getInsightsSummary);

module.exports = router;
