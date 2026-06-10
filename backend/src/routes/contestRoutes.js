const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/redisCache');
const { cacheMiddleware } = require('../middleware/cache');
const {
  getContests,
  refreshContests,
  setReminder,
  removeReminder,
  getUserReminders,
  getContestsCalendar
} = require('../controllers/contestController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', cacheMiddleware(60), cacheResponse(300), getContests);
router.get('/calendar', cacheMiddleware(60), cacheResponse(300), getContestsCalendar);

// Protected routes
router.post('/refresh', protect, refreshContests);
router.get('/reminders', protect, cacheResponse(30), getUserReminders);
router.post('/:contestId/reminder', protect, setReminder);
router.delete('/:contestId/reminder', protect, removeReminder);

module.exports = router;
