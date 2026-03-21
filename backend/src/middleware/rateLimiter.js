/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again in a minute.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

/**
 * Sync operation rate limiter
 * More restrictive: 5 sync requests per 5 minutes per user
 */
const syncRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: {
    success: false,
    message: 'Too many sync requests. Please wait before syncing again.',
    retryAfter: 300
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID for authenticated users
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admin users (if you have an admin role)
    return req.user?.role === 'admin';
  }
});

/**
 * Auth rate limiter
 * 10 login attempts per 15 minutes
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour
 */
const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Rate limit exceeded for this operation.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiRateLimiter,
  syncRateLimiter,
  authRateLimiter,
  strictRateLimiter
};
