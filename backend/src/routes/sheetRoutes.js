const express = require('express');
const router = express.Router();
const sheetController = require('../controllers/sheetController');
const { protect } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/redisCache');

// All routes require authentication
router.use(protect);

// Get all progress for user (all sheets)
router.get('/progress', cacheResponse(60), sheetController.getAllProgress);

// Get progress for a specific sheet
router.get('/progress/:sheetId', cacheResponse(60), sheetController.getSheetProgress);

// Get progress stats
router.get('/stats', cacheResponse(60), sheetController.getProgressStats);

// Get revision problems
router.get('/revision', cacheResponse(60), sheetController.getRevisionProblems);

// Update problem status
router.post('/status', sheetController.updateProblemStatus);

// Update problem notes
router.post('/notes', sheetController.updateProblemNotes);

// Toggle revision
router.post('/revision', sheetController.toggleRevision);

module.exports = router;
