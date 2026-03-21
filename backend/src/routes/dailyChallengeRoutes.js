const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/redisCache');
const dailyChallengeController = require('../controllers/dailyChallengeController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get today's challenge
router.get('/today', cacheResponse(1800), dailyChallengeController.getTodayChallenge);

// Mark challenge as complete (with verification)
router.post('/complete', dailyChallengeController.completeChallenge);

// Verify and complete (explicit verification)
router.post('/verify', dailyChallengeController.verifyAndComplete);

// Skip current challenge and get a new one
router.post('/skip', dailyChallengeController.skipChallenge);

// Get streak history
router.get('/streak', cacheResponse(1800), dailyChallengeController.getStreakHistory);

// Get challenge history
router.get('/history', cacheResponse(1800), dailyChallengeController.getChallengeHistory);

// Get topic stats
router.get('/topics', cacheResponse(1800), dailyChallengeController.getTopicStats);

module.exports = router;
