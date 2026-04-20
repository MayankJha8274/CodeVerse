const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const comparisonController = require('../controllers/comparisonController');
const { cacheResponse } = require('../middleware/redisCache');

/**
 * Comparison Routes
 * All routes require authentication
 */

// Search users for comparison
router.get('/search-users', protect, cacheResponse(60), comparisonController.searchUsers);

// Compare two users
router.get('/users', protect, cacheResponse(60), comparisonController.compareUsers);

// Compare current user with room averages
router.get('/room/:roomId', protect, cacheResponse(60), comparisonController.compareWithRoom);

// Get top performers (global or room-specific)
router.get('/top', protect, cacheResponse(60), comparisonController.getTopPerformers);

module.exports = router;
