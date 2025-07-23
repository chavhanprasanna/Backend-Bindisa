import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

// Mock the entire app for integration testing
let app;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    
    // Import app after setting environment
    const appModule = await import('../src/app.js');
    app = appModule.default;
  });

  afterAll(async () => {
    // Clean up database connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Health Check', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('OTP Routes', () => {
    describe('POST /api/otp/request', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/otp/request')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should validate email format', async () => {
        const response = await request(app)
          .post('/api/otp/request')
          .send({
            identifier: 'invalid-email',
            type: 'login'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate phone number format', async () => {
        const response = await request(app)
          .post('/api/otp/request')
          .send({
            identifier: '123', // Invalid phone
            type: 'login'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should accept valid email', async () => {
        const response = await request(app)
          .post('/api/otp/request')
          .send({
            identifier: 'test@example.com',
            type: 'login'
          });

        // Should not return 400 validation error
        expect(response.status).not.toBe(400);
      });

      it('should accept valid phone number', async () => {
        const response = await request(app)
          .post('/api/otp/request')
          .send({
            identifier: '+919876543210',
            type: 'login'
          });

        // Should not return 400 validation error
        expect(response.status).not.toBe(400);
      });
    });

    describe('POST /api/otp/verify', () => {
      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/otp/verify')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate OTP format', async () => {
        const response = await request(app)
          .post('/api/otp/verify')
          .send({
            identifier: 'test@example.com',
            otp: '12', // Too short
            type: 'login'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to OTP requests', async () => {
      const identifier = 'rate-test@example.com';
      
      // Make multiple requests quickly
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/otp/request')
            .send({
              identifier,
              type: 'login'
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/otp/request')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing content-type', async () => {
      const response = await request(app)
        .post('/api/otp/request')
        .send('plain text');

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/otp/request')
        .expect(405); // Method not allowed

      // Check for security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });
});
