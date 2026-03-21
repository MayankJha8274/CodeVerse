/**
 * Winston Logger Configuration
 * Centralized logging for sync operations
 */

const winston = require('winston');
const path = require('path');

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// JSON format for file logging
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logs directory path
const logsDir = path.join(__dirname, '../../logs');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'codeverse-sync' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    }),
    // File transport for sync operations
    new winston.transports.File({
      filename: path.join(logsDir, 'sync.log'),
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Sync-specific logging methods
const syncLogger = {
  // Log sync start
  syncStart: (userId, platform, triggeredBy) => {
    logger.info('Sync started', {
      event: 'sync_start',
      userId,
      platform: platform || 'all',
      triggeredBy
    });
  },

  // Log sync completion
  syncComplete: (userId, platform, duration, stats) => {
    logger.info('Sync completed', {
      event: 'sync_complete',
      userId,
      platform: platform || 'all',
      durationMs: duration,
      stats
    });
  },

  // Log sync failure
  syncFailed: (userId, platform, error, attempts) => {
    logger.error('Sync failed', {
      event: 'sync_failed',
      userId,
      platform: platform || 'all',
      error: error.message || error,
      stack: error.stack,
      attempts
    });
  },

  // Log platform-specific fetch
  platformFetch: (userId, platform, success, duration, error = null) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Platform fetch ${success ? 'succeeded' : 'failed'}`, {
      event: 'platform_fetch',
      userId,
      platform,
      success,
      durationMs: duration,
      error: error?.message || null
    });
  },

  // Log rate limit hit
  rateLimitHit: (userId, platform) => {
    logger.warn('Rate limit reached', {
      event: 'rate_limit',
      userId,
      platform
    });
  },

  // Log queue event
  queueEvent: (event, jobId, data = {}) => {
    logger.info(`Queue event: ${event}`, {
      event: `queue_${event}`,
      jobId,
      ...data
    });
  },

  // Log API failure
  apiFailure: (platform, endpoint, statusCode, error) => {
    logger.error('External API failure', {
      event: 'api_failure',
      platform,
      endpoint,
      statusCode,
      error: error?.message || error
    });
  },

  // General info log
  info: (message, meta = {}) => logger.info(message, meta),

  // General error log
  error: (message, meta = {}) => logger.error(message, meta),

  // General warn log
  warn: (message, meta = {}) => logger.warn(message, meta),

  // General debug log
  debug: (message, meta = {}) => logger.debug(message, meta)
};

module.exports = {
  logger,
  syncLogger
};
