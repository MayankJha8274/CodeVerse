const { getRedisConnection } = require('../config/redis');

/**
 * Redis Cache Middleware
 * Automatically caches API responses to dramatically speed up dashboard loading.
 * Only caches 200 OK responses.
 * 
 * @param {number} duration - Cache duration in seconds
 */
const cacheResponse = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const redis = getRedisConnection();
    
    // If Redis is not available or disabled, bypass caching
    if (!redis) {
      return next();
    }

    // Build a unique cache key based on route and user
    // e.g., 'cache:user:12345:/api/dashboard/combined'
    const userId = req.user ? req.user._id.toString() : 'public';
    const cacheKey = `cache:user:${userId}:${req.originalUrl || req.url}`;

    try {
      console.log('Checking cache for:', cacheKey);
      // 1. Check if we have a cached response
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log('âš¡ CACHE HIT for:', cacheKey);
        // Return instantly from RAM
        const parsedData = JSON.parse(cachedData);
        // We inject a meta flag purely for debugging to show it was cached
        parsedData._isFromRedisCache = true; 
        
        return res.status(200).json(parsedData);
      }

      // 2. If not in cache, intercept the res.json() to save it before sending to user
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful requests
        if (res.statusCode === 200 && body && typeof body === 'object') {
          // Fire and forget caching to not block the current request
          redis.setex(cacheKey, duration, JSON.stringify(body)).catch(err => {
            console.error('Redis cache saving error:', err.message);
          });
        }
        
        // Return original data
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Redis cache middleware error:', err.message);
      // Fail silently and bypass cache to not break the app
      next();
    }
  };
};

/**
 * Invalidate a specific cache pattern for a user
 * Call this when user triggers a manual sync or completes a challenge.
 */
const clearUserCache = async (userId) => {
  const redis = getRedisConnection();
  if (!redis || !userId) return;

  try {
    const pattern = `cache:user:${userId.toString()}:*`;
    // Bull/ioredis `.keys` can be slow on huge DBs but fine for our scale
    // In production, `SCAN` or tagging would be better.
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🧹 Cleared ${keys.length} cached keys for user ${userId}`);
    }
  } catch (err) {
    console.error('Redis cache clear error:', err.message);
  }
};

module.exports = {
  cacheResponse,
  clearUserCache
};