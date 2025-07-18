import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import logger from './logger.js';
import { ApiError } from './apiError.js';

/**
 * JWT utility class for token generation, verification, and management
 */
class JWT {
  /**
   * Generate a new JWT token
   * @param {Object} payload - Token payload
   * @param {string|number} [expiresIn='1d'] - Expiration time (e.g., '1h', '7d', '30d')
   * @param {string} [secret] - Secret key (defaults to JWT_SECRET from config)
   * @returns {string} JWT token
   */
  static generateToken(payload, expiresIn = '1d', secret) {
    const jwtSecret = secret || config.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      return jwt.sign(payload, jwtSecret, {
        expiresIn,
        algorithm: 'HS256', // Use HMAC-SHA256
        issuer: config.APP_NAME || 'myapp',
        audience: config.APP_URL || 'http://localhost:3000'
      });
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw new ApiError(500, 'Failed to generate token');
    }
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token to verify
   * @param {string} [secret] - Secret key (defaults to JWT_SECRET from config)
   * @returns {Object} Decoded token payload
   * @throws {ApiError} If token is invalid or expired
   */
  static verifyToken(token, secret) {
    const jwtSecret = secret || config.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      return jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.APP_NAME || 'myapp',
        audience: config.APP_URL || 'http://localhost:3000'
      });
    } catch (error) {
      logger.error('Error verifying JWT token:', error);

      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token has expired');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid token');
      }

      throw new ApiError(401, 'Failed to verify token');
    }
  }

  /**
   * Decode a JWT token without verification
   * @param {string} token - JWT token to decode
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding JWT token:', error);
      return null;
    }
  }

  /**
   * Generate a refresh token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  static generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      type: 'refresh'
    };

    return this.generateToken(payload, '30d', config.JWT_REFRESH_SECRET || config.JWT_SECRET);
  }

  /**
   * Verify a refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   */
  static verifyRefreshToken(token) {
    const secret = config.JWT_REFRESH_SECRET || config.JWT_SECRET;
    return this.verifyToken(token, secret);
  }

  /**
   * Generate an access token
   * @param {Object} user - User object
   * @param {string[]} [scopes] - Array of scopes/permissions
   * @returns {string} Access token
   */
  static generateAccessToken(user, scopes = []) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
      type: 'access',
      scopes
    };

    return this.generateToken(payload, '15m');
  }

  /**
   * Generate a password reset token
   * @param {Object} user - User object
   * @returns {string} Password reset token
   */
  static generatePasswordResetToken(user) {
    const payload = {
      sub: user.id,
      type: 'password_reset'
    };

    return this.generateToken(payload, '1h');
  }

  /**
   * Generate an email verification token
   * @param {Object} user - User object
   * @returns {string} Email verification token
   */
  static generateEmailVerificationToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'email_verification'
    };

    return this.generateToken(payload, '24h');
  }

  /**
   * Generate a random token (for CSRF, API keys, etc.)
   * @param {number} [length=32] - Token length in bytes
   * @param {string} [encoding='hex'] - Encoding (hex, base64, etc.)
   * @returns {string} Random token
   */
  static generateRandomToken(length = 32, encoding = 'hex') {
    return crypto.randomBytes(length).toString(encoding);
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header
   * @returns {string|null} Token or null if not found
   */
  static extractToken(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }

    return null;
  }

  /**
   * Get token expiration date
   * @param {string} token - JWT token
   * @returns {Date|null} Expiration date or null if invalid
   */
  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || !decoded.payload.exp) {
        return null;
      }

      return new Date(decoded.payload.exp * 1000);
    } catch (error) {
      logger.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  static isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);

    if (!expiration) {
      return true;
    }

    return expiration < new Date();
  }

  /**
   * Generate a token pair (access + refresh tokens)
   * @param {Object} user - User object
   * @param {string[]} [scopes] - Array of scopes/permissions
   * @returns {Object} Object containing access and refresh tokens
   */
  static generateTokenPair(user, scopes = []) {
    const accessToken = this.generateAccessToken(user, scopes);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate a secure hash of a string (for API keys, etc.)
   * @param {string} data - Data to hash
   * @param {string} [salt] - Optional salt
   * @returns {string} Hashed string
   */
  static generateHash(data, salt = '') {
    const hash = crypto.createHash('sha256');
    hash.update(data + salt + (config.APP_SECRET || ''));
    return hash.digest('hex');
  }

  /**
   * Generate a secure random string (for API keys, etc.)
   * @param {number} [length=32] - Length of the string
   * @param {string} [charset] - Character set to use
   * @returns {string} Random string
   */
  static generateRandomString(length = 32, charset) {
    let result = '';

    if (charset) {
      const chars = charset.split('');
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    } else {
      // Default to URL-safe base64
      result = crypto
        .randomBytes(Math.ceil(length * 0.75)) // Account for base64 overhead
        .toString('base64')
        .replace(/[+/]/g, '') // Remove non-URL-safe characters
        .slice(0, length);
    }

    return result;
  }
}

export default JWT;
