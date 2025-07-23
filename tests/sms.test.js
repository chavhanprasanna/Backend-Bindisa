import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { formatPhoneNumber, isValidPhoneNumber } from '../src/services/sms.service.js';

// Mock config
jest.unstable_mockModule('../src/config/otp.config.js', () => ({
  DEFAULT_COUNTRY_CODE: '+91',
  PHONE_REGEX: /^[+]?[0-9]{10,15}$/,
  TEST_PHONE_NUMBERS: ['1234567890', '9876543210']
}));

// Mock ApiError
jest.unstable_mockModule('../src/utils/apiError.js', () => ({
  ApiError: class ApiError extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
    }
  }
}));

describe('SMS Service Tests', () => {
  describe('formatPhoneNumber', () => {
    it('should format phone number with country code', () => {
      const formatted = formatPhoneNumber('9876543210');
      expect(formatted).toBe('+919876543210');
    });

    it('should handle phone number that already has country code', () => {
      const formatted = formatPhoneNumber('+919876543210');
      expect(formatted).toBe('+919876543210');
    });

    it('should handle phone number with different country code', () => {
      const formatted = formatPhoneNumber('1234567890', '+1');
      expect(formatted).toBe('+11234567890');
    });

    it('should throw error for empty phone number', () => {
      expect(() => {
        formatPhoneNumber('');
      }).toThrow('Phone number is required');
    });

    it('should throw error for null phone number', () => {
      expect(() => {
        formatPhoneNumber(null);
      }).toThrow('Phone number is required');
    });

    it('should throw error for non-string phone number', () => {
      expect(() => {
        formatPhoneNumber(123456789);
      }).toThrow('Phone number must be a string');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('+919876543210')).toBe(true);
      expect(isValidPhoneNumber('9876543210')).toBe(true);
      expect(isValidPhoneNumber('+11234567890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false); // Too short
      expect(isValidPhoneNumber('12345678901234567890')).toBe(false); // Too long
      expect(isValidPhoneNumber('abc123')).toBe(false); // Contains letters
      expect(isValidPhoneNumber('')).toBe(false); // Empty
    });

    it('should handle null/undefined phone numbers', () => {
      expect(isValidPhoneNumber(null)).toBe(false);
      expect(isValidPhoneNumber(undefined)).toBe(false);
    });
  });
});
