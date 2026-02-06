const express = require('express');
const router = express.Router();
const {
  connectPlatform,
  disconnectPlatform,
  syncAllPlatforms,
  getAggregatedStats,
  getPlatformStats,
  getProgress,
  getTopicAnalysis,
  getBadges,
  getAchievements
} = require('../controllers/platformController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Platform connection management
router.put('/connect', connectPlatform);
router.delete('/disconnect/:platform', disconnectPlatform);

// Stats fetching
router.post('/sync', syncAllPlatforms);
router.get('/stats', getAggregatedStats);
router.get('/stats/:platform', getPlatformStats);

// Progress tracking
router.get('/progress', getProgress);

// Topic analysis, badges, and achievements
router.get('/topics', getTopicAnalysis);
router.get('/badges', getBadges);
router.get('/achievements', getAchievements);

module.exports = router;
