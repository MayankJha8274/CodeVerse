const express = require('express');
const router = express.Router();
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
router.get('/', getContests);
router.get('/calendar', getContestsCalendar);

// Protected routes
router.post('/refresh', protect, refreshContests);
router.get('/reminders', protect, getUserReminders);
router.post('/:contestId/reminder', protect, setReminder);
router.delete('/:contestId/reminder', protect, removeReminder);

module.exports = router;
