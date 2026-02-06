const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
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
router.get('/', getGlobalLeaderboard);

// @route   GET /api/leaderboard/rank
// @desc    Get current user's rank
// @access  Private
router.get('/rank', getUserRank);

// @route   GET /api/leaderboard/institution/:institution
// @desc    Get institution-specific leaderboard
// @access  Private
router.get('/institution/:institution', getInstitutionLeaderboard);

module.exports = router;
