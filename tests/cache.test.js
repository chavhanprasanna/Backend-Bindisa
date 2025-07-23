import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Redis client
const mockRedisClient = {
  connect: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushDb: jest.fn(),
  on: jest.fn()
};

jest.unstable_mockModule('redis', () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

describe('Cache System Tests', () => {
  let cache;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Import cache after mocking Redis
    const cacheModule = await import('../src/utils/cache.js');
    cache = cacheModule.default;
  });

  describe('Redis Integration', () => {
    it('should initialize Redis client', async () => {
      const { createClient } = await import('redis');
      const { initializeRedis } = await import('../src/utils/cache.js');
      
      await initializeRedis();
      
      expect(createClient).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should handle Redis connection errors gracefully', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      const { initializeRedis } = await import('../src/utils/cache.js');
      
      // Should not throw error
      await expect(initializeRedis()).resolves.not.toThrow();
    });
  });

  describe('Cache Operations', () => {
    it('should set and get values from cache', async () => {
      const testKey = 'test-key';
      const testValue = { data: 'test-data' };
      
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));
      
      await cache.set(testKey, testValue);
      const result = await cache.get(testKey);
      
      expect(result).toEqual(testValue);
    });

    it('should handle cache misses', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await cache.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should delete values from cache', async () => {
      const testKey = 'delete-test';
      
      await cache.del(testKey);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(testKey);
    });

    it('should flush entire cache', async () => {
      await cache.flush();
      
      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });

    it('should set TTL for cached values', async () => {
      const testKey = 'ttl-test';
      const testValue = { data: 'ttl-data' };
      const ttl = 3600;
      
      await cache.set(testKey, testValue, ttl);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue),
        { EX: ttl }
      );
    });
  });

  describe('Fallback to Memory Cache', () => {
    it('should use memory cache when Redis is unavailable', async () => {
      // Simulate Redis error
      mockRedisClient.get.mockRejectedValue(new Error('Redis unavailable'));
      
      const testKey = 'memory-test';
      const testValue = { data: 'memory-data' };
      
      // Set value (should fallback to memory)
      await cache.set(testKey, testValue);
      
      // Get value (should fallback to memory)
      const result = await cache.get(testKey);
      
      // Should still work with memory cache
      expect(result).toEqual(testValue);
    });

    it('should handle Redis set failures gracefully', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Redis set failed'));
      
      const testKey = 'set-fail-test';
      const testValue = { data: 'set-fail-data' };
      
      // Should not throw error
      await expect(cache.set(testKey, testValue)).resolves.not.toThrow();
    });

    it('should handle Redis delete failures gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis delete failed'));
      
      // Should not throw error
      await expect(cache.del('test-key')).resolves.not.toThrow();
    });
  });
});
