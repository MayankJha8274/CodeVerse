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

// Debug: Show last 10 days of calendar data for verification
router.get('/calendar-debug', protect, async (req, res) => {
  try {
    const { getContributionCalendar } = require('../services/aggregationService');
    const calendarData = await getContributionCalendar(req.user.id);
    const last10 = calendarData.calendar.slice(-10);
    const todayLocal = new Date();
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth()+1).padStart(2,'0')}-${String(todayLocal.getDate()).padStart(2,'0')}`;
    
    res.json({
      success: true,
      debug: {
        serverLocalDate: todayStr,
        serverUTCDate: new Date().toISOString().split('T')[0],
        calendarLength: calendarData.calendar.length,
        firstDate: calendarData.calendar[0]?.date,
        lastDate: calendarData.calendar[calendarData.calendar.length - 1]?.date,
        todayInCalendar: !!calendarData.calendar.find(d => d.date === todayStr),
        stats: calendarData.stats,
        last10Days: last10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
