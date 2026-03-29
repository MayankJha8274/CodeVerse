const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/redisCache');
const { protect } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');
const userAnalyticsController = require('../controllers/userAnalyticsController');

/**
 * Analytics Routes
 * All routes require authentication
 */

// User Analytics for Society/Room Leaderboards
router.get('/entity/:entityId/trend', protect, cacheResponse(600), userAnalyticsController.getAnalyticsTrend);
router.get('/entity/:entityId/comparison', protect, cacheResponse(600), userAnalyticsController.getAnalyticsComparison);
router.get('/entity/:entityId/weekly', protect, cacheResponse(600), userAnalyticsController.getAnalyticsWeekly);
router.get('/entity/:entityId/streak', protect, cacheResponse(600), userAnalyticsController.getAnalyticsStreak);

// Aggregation & Progress Analytics
router.get('/streaks', protect, cacheResponse(1800), analyticsController.getStreaks);
router.get('/languages', protect, cacheResponse(1800), analyticsController.getLanguages);
router.get('/weekly-progress', protect, cacheResponse(1800), analyticsController.getWeeklyProgress);

// Rating Analytics
router.get('/rating-history/:platform', protect, cacheResponse(1800), analyticsController.getRatingHistory);
router.get('/all-rating-history', protect, cacheResponse(1800), analyticsController.getAllRatingHistory);
router.get('/rating-changes', protect, cacheResponse(1800), analyticsController.getRatingChanges);
router.get('/rating-prediction/:platform', protect, cacheResponse(1800), analyticsController.getRatingPrediction);
router.get('/contest-performance', protect, cacheResponse(1800), analyticsController.getContestPerformance);
router.get('/highest-rated', protect, cacheResponse(1800), analyticsController.getHighestRated);

// Insights & Recommendations
router.get('/weak-areas', protect, cacheResponse(1800), analyticsController.getWeakAreas);
router.get('/daily-goals', protect, cacheResponse(1800), analyticsController.getDailyGoals);
router.get('/similar-users', protect, cacheResponse(1800), analyticsController.getSimilarUsers);
router.get('/achievements', protect, cacheResponse(1800), analyticsController.getAchievements);
router.get('/insights', protect, cacheResponse(1800), analyticsController.getInsightsSummary);

// Public Global Stats
router.get('/global', cacheResponse(300), analyticsController.getGlobalStats);

module.exports = router;
