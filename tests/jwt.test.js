import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import JWT from '../src/utils/jwt.js';

// Mock config
jest.unstable_mockModule('../src/config/env.js', () => ({
  default: {
    JWT_ACCESS_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    APP_NAME: 'Test App',
    APP_URL: 'http://localhost:3000'
  }
}));

describe('JWT Utility Tests', () => {
  const testPayload = { userId: '123', email: 'test@example.com' };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWT.generateToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with custom expiration', () => {
      const token = JWT.generateToken(testPayload, '1h');
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should throw error when JWT_ACCESS_SECRET is not defined', () => {
      // Mock config without JWT_ACCESS_SECRET
      jest.doMock('../src/config/env.js', () => ({
        default: {}
      }));

      expect(() => {
        JWT.generateToken(testPayload);
      }).toThrow('JWT_ACCESS_SECRET is not defined in environment variables');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = JWT.generateToken(testPayload);
      const decoded = JWT.verifyToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWT.verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = JWT.generateToken(testPayload, '-1s'); // Already expired
      
      expect(() => {
        JWT.verifyToken(expiredToken);
      }).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const refreshToken = JWT.generateRefreshToken(testPayload);
      
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const { accessToken, refreshToken } = JWT.generateTokenPair(testPayload);
      
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3);
      expect(refreshToken.split('.')).toHaveLength(3);
    });
  });
});
