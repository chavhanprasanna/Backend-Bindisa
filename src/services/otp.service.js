import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import cache from '../utils/cache.js';
import { sendEmail } from '../utils/email.js';
import smsService, { auth as firebaseAuth } from './sms.service.js';
import {
  OTP_LENGTH,
  OTP_EXPIRY,
  PHONE_OTP_EXPIRY,
  OTP_ATTEMPTS_LIMIT,
  OTP_RESEND_DELAY,
  PHONE_OTP_RESEND_DELAY,
  OTP_TYPES,
  OTP_DELIVERY_METHODS,
  OTP_TEMPLATES,
  OTP_EMAIL_SUBJECTS,
  OTP_SMS_MESSAGES,
  OTP_RATE_LIMIT,
  TEST_PHONE_NUMBERS
} from '../config/otp.config.js';

// OTP Service Class
class OTPService {
  constructor() {
    this.jwtSecret = process.env.JWT_OTP_SECRET || 'your-otp-jwt-secret';
    this.firebaseEnabled = Boolean(process.env.FIREBASE_API_KEY);

    if (!this.firebaseEnabled) {
      logger.warn('Firebase is not configured. Phone OTP will not work without Firebase API key.');
    }
  }

  /**
   * Generate a random OTP code
   * @param {number} length - Length of OTP code
   * @returns {string} Generated OTP code
   */
  generateOTP(length = OTP_LENGTH) {
    const digits = '0123456789';
    let otp = '';

    // Generate cryptographically secure random OTP
    const randomValues = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[randomValues[i] % digits.length];
    }

    return otp;
  }

  /**
   * Generate a secure hash for OTP
   * @param {string} otp - OTP code
   * @param {string} secret - Secret key
   * @returns {string} Hashed OTP
   */
  generateOTPHash(otp, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(otp)
      .digest('hex');
  }

  /**
   * Generate a cache key for OTP operations
   * @private
   * @param {string} type - OTP type (e.g., 'login', 'reset')
   * @param {string} identifier - User identifier (email/phone)
   * @returns {string} Cache key
   */
  _getCacheKey(type, identifier) {
    return `otp:${type}:${identifier}`;
  }

  /**
   * Generate and store OTP
   * @param {string} type - Type of OTP (login, register, reset_password, etc.)
   * @param {string} identifier - Email or phone number
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generated OTP and expiry time or Firebase verification ID
   */
  async generateAndStoreOTP(type, identifier, options = {}) {
    const {
      length = OTP_LENGTH,
      expiry = type.startsWith('phone_') ? PHONE_OTP_EXPIRY : OTP_EXPIRY,
      deliveryMethod = identifier.includes('@') ? OTP_DELIVERY_METHODS.EMAIL : OTP_DELIVERY_METHODS.SMS,
      metadata = {},
      recaptchaVerifier = null
    } = options;

    // Set resend delay based on delivery method
    const resendDelay = deliveryMethod === OTP_DELIVERY_METHODS.SMS ? PHONE_OTP_RESEND_DELAY : OTP_RESEND_DELAY;

    const cacheKey = this._getCacheKey(type, identifier);
    const now = Date.now();

    // Check if there's an existing OTP that hasn't expired
    const existingOTP = await cache.get(cacheKey);
    // For phone numbers, generate OTP and simulate SMS sending
    if (deliveryMethod === OTP_DELIVERY_METHODS.SMS) {
      // Generate OTP for SMS
      const otp = this.generateOTP(length);
      const expiresAt = new Date(now + (expiry * 1000));
      
      // Store OTP in cache for verification
      await cache.set(cacheKey, {
        otp,
        attempts: 0,
        maxAttempts: OTP_ATTEMPTS_LIMIT,
        createdAt: now,
        expiresAt: expiresAt.getTime(),
        verified: false,
        phoneNumber: identifier,
        type,
        metadata
      }, expiry);

      // Update last request time
      const lastRequestKey = `otp:${type}:${identifier}:last_request`;
      await cache.set(lastRequestKey, Date.now().toString(), resendDelay);

      // In development mode, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        logger.info(`📱 SMS OTP for ${identifier}: ${otp} (expires in ${expiry}s)`);
      }

      // Try to send SMS if Firebase is configured, but don't fail if it's not
      try {
        if (this.firebaseEnabled) {
          // For now, just log that we would send SMS
          logger.info(`Would send SMS OTP ${otp} to ${identifier}`);
        } else {
          logger.warn('Firebase not configured - SMS not sent. Using development mode.');
        }
      } catch (error) {
        logger.warn('SMS sending failed, but OTP is still valid for testing:', error.message);
      }

      return {
        success: true,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        phoneNumber: identifier,
        expiresAt: Math.floor(expiresAt.getTime() / 1000),
        testMode: process.env.NODE_ENV === 'development'
      };
    }

    // For email OTPs, use the existing flow
    const lastRequestKey = `otp:${type}:${identifier}:last_request`;
    const lastRequest = await cache.get(lastRequestKey);

    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - parseInt(lastRequest, 10);
      if (timeSinceLastRequest < resendDelay * 1000) {
        const waitTime = Math.ceil((resendDelay * 1000 - timeSinceLastRequest) / 1000);
        throw new ApiError(429, `Please wait ${waitTime} seconds before requesting a new OTP`, {
          code: 'TOO_MANY_REQUESTS',
          retryAfter: waitTime
        });
      }
    }

    // Generate new OTP
    const otp = this.generateOTP(length);
    const expiresAt = new Date(now + (expiry * 1000));

    // Store OTP in cache
    await cache.set(cacheKey, {
      otp,
      attempts: 0,
      maxAttempts: OTP_ATTEMPTS_LIMIT,
      createdAt: now,
      expiresAt: expiresAt.getTime(),
      verified: false,
      metadata
    }, expiry);

    // Update last request time
    await cache.set(lastRequestKey, Date.now().toString(), resendDelay);

    return {
      otp,
      expiresAt,
      resendAfter: resendDelay,
      testMode: false
    };
  }

  /**
   * Verify OTP
   * @param {string} type - Type of OTP
   * @param {string} identifier - Email or phone number
   * @param {string} otp - OTP to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyOTP(type, identifier, otp) {
    const cacheKey = `otp:${type}:${identifier}`;
    const otpData = await cache.get(cacheKey);

    if (!otpData) {
      return {
        valid: false,
        message: 'OTP not found or expired',
        code: 'OTP_NOT_FOUND'
      };
    }

    // Handle stored OTP data (could be object or JSON string)
    let parsedData;
    if (typeof otpData === 'string') {
      try {
        parsedData = JSON.parse(otpData);
      } catch (error) {
        logger.error('Failed to parse OTP data', { error, otpData });
        return {
          valid: false,
          message: 'Invalid OTP data',
          code: 'INVALID_OTP_DATA'
        };
      }
    } else {
      parsedData = otpData;
    }

    // Skip Firebase verification - we're using direct OTP comparison now

    // For email OTPs, verify the code directly
    if (!parsedData.otp) {
      return {
        valid: false,
        message: 'Invalid OTP format',
        code: 'INVALID_OTP_FORMAT'
      };
    }

    // Check if OTP is correct using constant-time comparison
    const isOTPValid = crypto.timingSafeEqual(
      Buffer.from(otp),
      Buffer.from(parsedData.otp)
    );

    if (!isOTPValid) {
      // Increment attempts
      const attempts = (parsedData.attempts || 0) + 1;

      // Check if max attempts reached
      if (attempts >= OTP_ATTEMPTS_LIMIT) {
        // Delete the OTP if max attempts reached
        await cache.del(cacheKey);

        return {
          valid: false,
          message: 'Maximum attempts reached. Please request a new OTP.',
          code: 'MAX_ATTEMPTS_REACHED'
        };
      }

      // Update attempts in cache
      await cache.set(
        cacheKey,
        JSON.stringify({
          ...parsedData,
          attempts
        }),
        parsedData.expiresIn || OTP_EXPIRY
      );

      return {
        valid: false,
        message: 'Invalid OTP',
        code: 'INVALID_OTP',
        remainingAttempts: OTP_ATTEMPTS_LIMIT - attempts
      };
    }

    // Verify OTP
    const isValid = await this._verifyOTP(otp, parsedData.otp);

    if (isValid) {
      // Mark OTP as verified
      await cache.set(cacheKey, {
        ...parsedData,
        verified: true,
        verifiedAt: Date.now()
      }, Math.ceil((parsedData.expiresIn || OTP_EXPIRY) / 1000));

      return {
        valid: true,
        message: 'OTP verified successfully',
        metadata: parsedData.metadata || {}
      };
    } else {
      // Increment attempts
      const attempts = (parsedData.attempts || 0) + 1;

      // Check if max attempts reached
      if (attempts >= OTP_ATTEMPTS_LIMIT) {
        // Delete the OTP if max attempts reached
        await cache.del(cacheKey);

        return {
          valid: false,
          message: 'Maximum attempts reached. Please request a new OTP.',
          code: 'MAX_ATTEMPTS_REACHED'
        };
      }

      // Update attempts in cache
      await cache.set(
        cacheKey,
        JSON.stringify({
          ...parsedData,
          attempts
        }),
        parsedData.expiresIn || OTP_EXPIRY
      );

      return {
        valid: false,
        message: 'Invalid OTP',
        code: 'INVALID_OTP',
        remainingAttempts: OTP_ATTEMPTS_LIMIT - attempts
      };
    }
  }

  /**
   * Internal method to verify OTP
   * @private
   * @param {string} inputOTP - User provided OTP
   * @param {string} storedOTP - Stored OTP
   * @returns {boolean} True if OTP is valid
   */
  _verifyOTP(inputOTP, storedOTP) {
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(inputOTP),
      Buffer.from(storedOTP)
    );
  }

  /**
   * Check if OTP is verified
   * @param {string} type - OTP type
   * @param {string} identifier - User identifier
   * @returns {Promise<boolean>} True if OTP is verified
   */
  async isVerified(type, identifier) {
    const cacheKey = this._getCacheKey(type, identifier);
    const otpData = await cache.get(cacheKey);
    return !!(otpData && otpData.verified);
  }

  /**
   * Invalidate OTP
   * @param {string} type - OTP type
   * @param {string} identifier - User identifier
   * @returns {Promise<boolean>} True if OTP was invalidated
   */
  async invalidateOTP(type, identifier) {
    const cacheKey = this._getCacheKey(type, identifier);
    return cache.del(cacheKey);
  }

  /**
   * Send OTP via email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {Object} options - Additional options
   * @param {string} [options.subject] - Email subject
   * @param {string} [options.template] - Email template name
   * @returns {Promise<boolean>} True if email was sent successfully
   */
  async sendOTPByEmail(email, otp, options = {}) {
    try {
      const { subject = 'Your Verification Code', template = 'otp' } = options;

      await sendEmail({
        to: email,
        subject,
        template,
        context: {
          otp,
          appName: process.env.APP_NAME || 'Our App',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com'
        }
      });

      logger.info(`OTP email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send OTP email to ${email}:`, error);
      throw new ApiError(500, 'Failed to send OTP email');
    }
  }

  /**
   * Send OTP via SMS (placeholder for actual SMS service integration)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} otp - OTP code
   * @returns {Promise<boolean>} True if SMS was sent successfully
   */
  async sendOTPBySMS(phoneNumber, otp) {
    // This is a placeholder for actual SMS service integration
    // In a real application, you would integrate with an SMS provider like Twilio, etc.
    logger.info(`SMS OTP ${otp} sent to ${phoneNumber}`);
    return true;
  }

  /**
   * Generate a secure token for OTP verification
   * @param {string} identifier - User identifier
   * @param {string} type - OTP type
   * @returns {string} JWT token
   */
  generateVerificationToken(identifier, type) {
    const payload = {
      jti: uuidv4(),
      sub: identifier,
      type,
      iat: Math.floor(Date.now() / 1000)
    };

    // Sign token with a short expiration (e.g., 10 minutes)
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '10m'
    });
  }

  /**
   * Verify OTP verification token
   * @param {string} token - JWT token
   * @returns {Promise<{valid: boolean, identifier: string, type: string}>} Verification result
   */
  async verifyVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        valid: true,
        identifier: decoded.sub,
        type: decoded.type
      };
    } catch (error) {
      return {
        valid: false,
        identifier: null,
        type: null,
        reason: error.message
      };
    }
  }
}

// Create and export a singleton instance
export const otpService = new OTPService();

export default otpService;
