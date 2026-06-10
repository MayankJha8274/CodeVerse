const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/redisCache');
const { cacheMiddleware } = require('../middleware/cache');
const {
  getGlobalLeaderboard,
  getUserRank,
  getInstitutionLeaderboard
} = require('../controllers/leaderboardController');

// All routes require authentication
router.use(protect);

// @route   GET /api/leaderboard
// @desc    Get global leaderboard
// @access  Private
router.get('/', cacheMiddleware(120), cacheResponse(300), getGlobalLeaderboard);

// @route   GET /api/leaderboard/rank
// @desc    Get current user's rank
// @access  Private (user-specific, no cacheMiddleware)
router.get('/rank', cacheResponse(300), getUserRank);

// @route   GET /api/leaderboard/institution/:institution
// @desc    Get institution-specific leaderboard
// @access  Private
router.get('/institution/:institution', cacheMiddleware(120), cacheResponse(300), getInstitutionLeaderboard);

module.exports = router;
