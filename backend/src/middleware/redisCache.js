const { getRedisConnection } = require('../config/redis');
const NodeCache = require('node-cache');

// Initialize in-memory cache as fallback
// stdTTL is the default time-to-live in seconds. We set it to 0 (unlimited) and override per-route.
const memoryCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });

/**
 * Redis Cache Middleware
 * Automatically caches API responses to dramatically speed up dashboard loading.
 * Falls back to in-memory (node-cache) if Redis is disabled or unavailable.
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
    
    // Build a unique cache key based on route and user
    // e.g., 'cache:user:12345:/api/dashboard/combined'
    const userId = req.user ? req.user._id.toString() : 'public';
    const cacheKey = `cache:user:${userId}:${req.originalUrl || req.url}`;

    try {
      let cachedData = null;
      let isRedis = false;

      // 1. Try fetching from Redis first
      if (redis) {
        try {
          cachedData = await redis.get(cacheKey);
          if (cachedData) isRedis = true;
        } catch (err) {
          console.warn('⚠️ Redis get error, falling back to memory cache:', err.message);
        }
      }

      // 2. Fallback to Memory Cache if Redis disabled/failed
      if (!cachedData && !redis) {
        cachedData = memoryCache.get(cacheKey);
      }

      // 3. Cache HIT
      if (cachedData) {
        console.log(`⚡ CACHE HIT (${isRedis ? 'Redis' : 'MemoryFallback'}) for:`, cacheKey);
        // Parse if it came from Redis (string), memoryCache returns object directly
        const parsedData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        
        parsedData._isFromCache = true;
        parsedData._cacheSource = isRedis ? 'Redis' : 'Memory';
        
        return res.status(200).json(parsedData);
      }

      // 4. Cache MISS - Intercept res.json() to save response
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful requests with JSON bodies
        if (res.statusCode === 200 && body && typeof body === 'object') {
          if (redis) {
            // Save to Redis
            redis.setex(cacheKey, duration, JSON.stringify(body)).catch(err => {
              console.error('Redis cache saving error:', err.message);
            });
          } else {
            // Save to Memory Cache
            console.log('📝 Saving to Memory Cache:', cacheKey);
            memoryCache.set(cacheKey, body, duration);
          }
        }
        
        // Return original data
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err.message);
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
  if (!userId) return;
  const userStr = userId.toString();

  // Clear Redis Cache
  const redis = getRedisConnection();
  if (redis) {
    try {
      const pattern = `cache:user:${userStr}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🧹 Cleared ${keys.length} Redis cached keys for user ${userStr}`);
      }
    } catch (err) {
      console.error('Redis cache clear error:', err.message);
    }
  } else {
    // Clear Memory Cache
    try {
      const keys = memoryCache.keys();
      const userKeys = keys.filter(k => k.startsWith(`cache:user:${userStr}:`));
      if (userKeys.length > 0) {
        memoryCache.del(userKeys);
        console.log(`🧹 Cleared ${userKeys.length} Memory cached keys for user ${userStr}`);
      }
    } catch (err) {
      console.error('Memory cache clear error:', err.message);
    }
  }
};

module.exports = {
  cacheResponse,
  clearUserCache
};