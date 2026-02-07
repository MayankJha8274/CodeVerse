const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

/**
 * Dashboard Routes
 * All routes require authentication
 */

// Get specific user's profile (public within app)
router.get('/profile/:userId', protect, dashboardController.getUserProfile);

// Get current user's summary
router.get('/summary', protect, dashboardController.getUserSummary);

// Get user's timeline/activity history
router.get('/timeline', protect, dashboardController.getUserTimeline);

// Get user's rooms
router.get('/rooms', protect, dashboardController.getUserRooms);

// Get contribution calendar (last 365 days)
router.get('/calendar', protect, dashboardController.getContributionCalendar);

module.exports = router;
