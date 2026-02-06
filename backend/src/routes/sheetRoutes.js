const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheetController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all progress for user (all sheets)
router.get('/progress', sheetController.getAllProgress);

// Get progress for a specific sheet
router.get('/progress/:sheetId', sheetController.getSheetProgress);

// Get progress stats
router.get('/stats', sheetController.getProgressStats);

// Get revision problems
router.get('/revision', sheetController.getRevisionProblems);

// Update problem status
router.post('/status', sheetController.updateProblemStatus);

// Update problem notes
router.post('/notes', sheetController.updateProblemNotes);

// Toggle revision
router.post('/revision', sheetController.toggleRevision);

module.exports = router;
