const express = require('express');
const router = express.Router();
const { cacheResponse } = require('../middleware/redisCache');
const {
  connectPlatform,
  disconnectPlatform,
  syncAllPlatforms,
  getSyncStatus,
  getAggregatedStats,
  getPlatformStats,
  getProgress,
  getTopicAnalysis,
  getBadges,
  getAchievements,
  getQueueStatistics
} = require('../controllers/platformController');
const { protect } = require('../middleware/auth');

// Try to load rate limiter (optional - requires npm install)
let syncRateLimiter, apiRateLimiter;
try {
  const rateLimiter = require('../middleware/rateLimiter');
  syncRateLimiter = rateLimiter.syncRateLimiter;
  apiRateLimiter = rateLimiter.apiRateLimiter;
} catch (err) {
  console.warn('⚠️ Rate limiter not available, running without rate limits');
  // Create no-op middleware
  syncRateLimiter = (req, res, next) => next();
  apiRateLimiter = (req, res, next) => next();
}

// All routes are protected (require authentication)
router.use(protect);

// Apply general API rate limiting
router.use(apiRateLimiter);

// Platform connection management
router.put('/connect', connectPlatform);
router.delete('/disconnect/:platform', disconnectPlatform);

// Sync endpoints (with stricter rate limiting)
router.post('/sync', syncRateLimiter, syncAllPlatforms);
router.get('/sync/status', getSyncStatus);

// Stats fetching
router.get('/stats', cacheResponse(1800), getAggregatedStats);
router.get('/stats/:platform', cacheResponse(1800), getPlatformStats);

// Progress tracking
router.get('/progress', getProgress);

// Topic analysis, badges, and achievements
router.get('/topics', getTopicAnalysis);
router.get('/badges', getBadges);
router.get('/achievements', getAchievements);

// Queue statistics (for monitoring)
router.get('/queue/stats', getQueueStatistics);

module.exports = router;
