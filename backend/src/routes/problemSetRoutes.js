const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createProblem,
  getPublicProblems,
  getMyProblems,
  getProblem,
  updateProblem,
  deleteProblem,
  addModerator,
  removeModerator,
  addTestCase,
  deleteTestCase,
  searchProblems
} = require('../controllers/problemSetController');

// Public routes
router.get('/public', getPublicProblems);

// Protected routes - order matters! Specific routes before :slug
router.get('/my-problems', protect, getMyProblems);
router.get('/search', protect, searchProblems);
router.post('/', protect, createProblem);

// Single problem routes (with optional auth for public access)
router.get('/:slug', optionalAuth, getProblem);
router.put('/:slug', protect, updateProblem);
router.delete('/:slug', protect, deleteProblem);

// Moderator management
router.post('/:slug/moderators', protect, addModerator);
router.delete('/:slug/moderators/:userId', protect, removeModerator);

// Test case management
router.post('/:slug/testcases', protect, addTestCase);
router.delete('/:slug/testcases/:testCaseId', protect, deleteTestCase);

module.exports = router;
