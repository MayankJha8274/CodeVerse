const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createRoom,
  getUserRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  removeMember,
  getRoomLeaderboard,
  getRoomAnalytics,
  promoteMember
} = require('../controllers/roomController');

// All routes require authentication
router.use(protect);

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', createRoom);

// @route   GET /api/rooms
// @desc    Get all rooms for current user
// @access  Private
router.get('/', getUserRooms);

// @route   POST /api/rooms/join
// @desc    Join room with invite code
// @access  Private
router.post('/join', joinRoom);

// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Private (member only)
router.get('/:id', getRoomById);

// @route   PUT /api/rooms/:id
// @desc    Update room details
// @access  Private (owner/admin only)
router.put('/:id', updateRoom);

// @route   DELETE /api/rooms/:id
// @desc    Delete room
// @access  Private (owner only)
router.delete('/:id', deleteRoom);

// @route   POST /api/rooms/:id/leave
// @desc    Leave room
// @access  Private
router.post('/:id/leave', leaveRoom);

// @route   DELETE /api/rooms/:id/members/:userId
// @desc    Remove member from room
// @access  Private (owner/admin only)
router.delete('/:id/members/:userId', removeMember);

// @route   PATCH /api/rooms/:id/members/:userId/promote
// @desc    Promote member to admin
// @access  Private (owner only)
router.patch('/:id/members/:userId/promote', promoteMember);

// @route   GET /api/rooms/:id/leaderboard
// @desc    Get room leaderboard
// @access  Private (member only)
router.get('/:id/leaderboard', getRoomLeaderboard);

// @route   GET /api/rooms/:id/analytics
// @desc    Get room analytics
// @access  Private (owner/admin only)
router.get('/:id/analytics', getRoomAnalytics);

module.exports = router;
