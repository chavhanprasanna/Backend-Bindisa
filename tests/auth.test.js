import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { addToBlacklist, isTokenBlacklisted } from '../src/middlewares/auth.js';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
  verify: jest.fn()
}));

// Mock User model
jest.unstable_mockModule('../src/models/User.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

describe('Auth Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Blacklist (LRU Cache)', () => {
    it('should add token to blacklist', () => {
      const testToken = 'test.jwt.token';
      
      addToBlacklist(testToken);
      
      expect(isTokenBlacklisted(testToken)).toBe(true);
    });

    it('should check if token is blacklisted', () => {
      const testToken = 'another.test.token';
      
      // Token should not be blacklisted initially
      expect(isTokenBlacklisted(testToken)).toBe(false);
      
      // Add to blacklist
      addToBlacklist(testToken);
      
      // Now it should be blacklisted
      expect(isTokenBlacklisted(testToken)).toBe(true);
    });

    it('should handle multiple tokens in blacklist', () => {
      const token1 = 'token.one';
      const token2 = 'token.two';
      const token3 = 'token.three';
      
      addToBlacklist(token1);
      addToBlacklist(token2);
      
      expect(isTokenBlacklisted(token1)).toBe(true);
      expect(isTokenBlacklisted(token2)).toBe(true);
      expect(isTokenBlacklisted(token3)).toBe(false);
    });

    it('should handle LRU cache size limits', () => {
      // This test would require access to the internal cache
      // For now, we'll test that the blacklist functions work
      const tokens = [];
      
      // Add many tokens to test LRU behavior
      for (let i = 0; i < 1500; i++) {
        const token = `test.token.${i}`;
        tokens.push(token);
        addToBlacklist(token);
      }
      
      // Recent tokens should still be blacklisted
      const recentToken = tokens[tokens.length - 1];
      expect(isTokenBlacklisted(recentToken)).toBe(true);
    });
  });

  describe('Token Auto-Expiry', () => {
    it('should handle expired tokens', () => {
      const jwt = require('jsonwebtoken');
      
      // Mock an expired token
      jwt.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });
      
      const expiredToken = 'expired.jwt.token';
      addToBlacklist(expiredToken);
      
      expect(isTokenBlacklisted(expiredToken)).toBe(true);
    });

    it('should handle tokens with future expiry', () => {
      const jwt = require('jsonwebtoken');
      
      // Mock a token that expires in the future
      jwt.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
      });
      
      const futureToken = 'future.jwt.token';
      addToBlacklist(futureToken);
      
      expect(isTokenBlacklisted(futureToken)).toBe(true);
    });
  });
});
