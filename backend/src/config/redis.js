/**
 * Redis Configuration for BullMQ
 * Handles connection to Redis for job queuing
 * Redis is OPTIONAL - app works without it using direct sync
 */

let Redis;
let redisAvailable = false;

try {
  Redis = require('ioredis');
  redisAvailable = true;
} catch (err) {
  console.warn('⚠️ ioredis not installed, Redis features disabled');
}

// Check if Redis is enabled via environment (default: false for easier setup)
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Base options required by BullMQ
const baseOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 2) return null;
    return Math.min(times * 500, 2000);
  }
};

// Create a connection instance securely 
const createRedisInstance = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      ...baseOptions,
      tls: { rejectUnauthorized: false }
    });
  } else {
    return new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      ...baseOptions
    });
  }
};

// Create Redis connection for BullMQ
let connection = null;
let connectionFailed = false;

const getRedisConnection = () => {
  if (!redisAvailable || !REDIS_ENABLED || connectionFailed) {
    return null;
  }

  if (!connection) {
    try {
      connection = createRedisInstance();

      connection.on('connect', () => {
        console.log('✅ Redis connected successfully');
      });

      connection.on('error', () => {
        if (!connectionFailed) {
          connectionFailed = true;
        }
      });
    } catch (err) {
      connectionFailed = true;
      return null;
    }
  }
  return connection;
};

// Create a new connection for workers (BullMQ requires separate connections)
const createWorkerConnection = () => {
  if (!redisAvailable || !REDIS_ENABLED || connectionFailed) {
    return null;
  }

  try {
    const workerConnection = createRedisInstance();
    workerConnection.on('error', () => {});
    return workerConnection;
  } catch (err) {
    return null;
  }
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisAvailable && REDIS_ENABLED && !connectionFailed;
};

module.exports = {
  redisConfig: {}, // Deprecated
  getRedisConnection,
  createWorkerConnection,
  isRedisAvailable,
  REDIS_ENABLED
};
