import { createClient } from 'redis';

let redisClient;
let redisAvailable = false;

// Fallback in-memory cache
const memoryCache = new Map();

async function initializeRedis() {
  const redisOptions = {
    socket: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > (parseInt(process.env.REDIS_RETRY_STRATEGY) || 3)) {
          console.warn('Max Redis reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return 1000; // Reconnect after 1 second
      }
    }
  };

  try {
    redisClient = createClient(redisOptions);

    redisClient.on('error', (err) => {
      console.error(`Redis error: ${err}`); // Changed from logger.error to console.error
      if (process.env.NODE_ENV === 'development') {
        console.log('Using in-memory cache fallback'); // Changed from logger.info
      }
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (err) {
    redisAvailable = false;
    console.warn('❌ Redis initialization failed, using in-memory cache:', err.message);
  }
}

// Export initialization function for proper startup sequence
export { initializeRedis };

const cache = {
  async get(key) {
    if (redisAvailable) {
      try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.warn('Redis get failed, falling back to memory:', err.message);
        return memoryCache.get(key) || null;
      }
    }
    return memoryCache.get(key) || null;
  },

  async set(key, val, ttl = 3600) {
    const stringValue = JSON.stringify(val);
    memoryCache.set(key, val); // Always update in-memory cache
    
    if (redisAvailable) {
      try {
        await redisClient.set(key, stringValue, {
          EX: ttl
        });
      } catch (err) {
        console.warn('Redis set failed, using in-memory cache only:', err.message);
      }
    }
  },

  async del(key) {
    memoryCache.delete(key);
    if (redisAvailable) {
      try {
        await redisClient.del(key);
      } catch (err) {
        console.warn('Redis delete failed:', err.message);
      }
    }
  },

  async flush() {
    memoryCache.clear();
    if (redisAvailable) {
      try {
        await redisClient.flushDb();
      } catch (err) {
        console.warn('Redis flush failed:', err.message);
      }
    }
  }
};

export default cache;