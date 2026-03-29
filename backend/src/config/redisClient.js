const Redis = require('ioredis');
require('dotenv').config();

let redisClient = null;

const createRedisClient = () => {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  if (!process.env.REDIS_URL) {
    console.warn('⚠️ REDIS_URL not found in .env. Redis features will be disabled.');
    return null;
  }

  try {
    // The 'lazyConnect: true' option prevents the client from connecting until it's actually needed.
    // This helps prevent hangs on startup if Redis isn't available.
    const client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    client.on('connect', () => console.log('✅ Connected to Redis'));
    client.on('error', (err) => console.error('❌ Redis Connection Error:', err));
    client.on('reconnecting', () => console.log('🟡 Reconnecting to Redis...'));

    redisClient = client;
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    return null;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
};

// Function to gracefully disconnect
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('🔌 Disconnected from Redis.');
  }
};

module.exports = {
  getRedisClient,
  disconnectRedis,
};