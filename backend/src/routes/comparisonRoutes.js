const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const comparisonController = require('../controllers/comparisonController');

/**
 * Comparison Routes
 * All routes require authentication
 */

// Search users for comparison
router.get('/search-users', protect, comparisonController.searchUsers);

// Compare two users
router.get('/users', protect, comparisonController.compareUsers);

// Compare current user with room averages
router.get('/room/:roomId', protect, comparisonController.compareWithRoom);

// Get top performers (global or room-specific)
router.get('/top', protect, comparisonController.getTopPerformers);

module.exports = router;
