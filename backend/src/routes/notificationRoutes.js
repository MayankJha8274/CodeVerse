const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Import the protect middleware
const NotificationLog = require('../models/NotificationLog');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await NotificationLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to the 20 most recent notifications

    const unreadCount = await NotificationLog.countDocuments({ userId: req.user.id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/notifications/read
 * @desc    Mark all notifications as read for the current user
 * @access  Private
 */
router.post('/read', protect, async (req, res) => {
  try {
    await NotificationLog.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;