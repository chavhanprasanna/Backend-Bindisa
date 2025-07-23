import express from 'express';
import otpService from '../services/otp.service.js';
import {
  OTP_TYPES,
  OTP_DELIVERY_METHODS,
  PHONE_REGEX,
  DEFAULT_COUNTRY_CODE
} from '../config/otp.config.js';
import rateLimit from 'express-rate-limit';
import { validateRequest } from '../middlewares/validateRequest.js';
import { body } from 'express-validator';
// Removed RecaptchaVerifier import as it's client-side only
import smsService, { auth as firebaseAuth } from '../services/sms.service.js';
import User from '../models/User.js';
import JWT from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const router = express.Router();

// GET endpoints for documentation and debugging

/**
 * @route   GET /api/v1/otp
 * @desc    Get OTP service information
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    service: 'OTP Service',
    version: '1.0.0',
    endpoints: {
      request: 'POST /api/v1/otp/request',
      verify: 'POST /api/v1/otp/verify',
      resend: 'POST /api/v1/otp/resend'
    },
    supportedTypes: Object.values(OTP_TYPES),
    deliveryMethods: Object.values(OTP_DELIVERY_METHODS)
  });
});

/**
 * @route   GET /api/v1/otp/request
 * @desc    Documentation for OTP request endpoint
 * @access  Public
 */
router.get('/request', (req, res) => {
  res.json({
    method: 'POST',
    endpoint: '/api/v1/otp/request',
    description: 'Request a new OTP via SMS',
    requiredFields: {
      identifier: 'Phone number (with country code)',
      type: 'OTP type (optional, defaults to "login")'
    },
    supportedTypes: Object.values(OTP_TYPES),
    rateLimit: '5 requests per hour per IP',
    example: {
      identifier: '+1234567890',
      type: 'login'
    }
  });
});

/**
 * @route   GET /api/v1/otp/verify
 * @desc    Documentation for OTP verification endpoint
 * @access  Public
 */
router.get('/verify', (req, res) => {
  res.json({
    method: 'POST',
    endpoint: '/api/v1/otp/verify',
    description: 'Verify an OTP code received via SMS',
    requiredFields: {
      identifier: 'Phone number (with country code)',
      otp: 'The OTP code received via SMS',
      type: 'OTP type (optional, defaults to "login")'
    },
    rateLimit: '10 attempts per 15 minutes per IP',
    example: {
      identifier: '+1234567890',
      otp: '123456',
      type: 'login'
    }
  });
});

// Input validation schemas
const requestOTPValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(async (value, { req }) => {
      console.log('Validating phone number:', value);
      if (!value) {
        console.log('Phone number is empty');
        return false;
      }
      
      // Validate phone number format
      console.log('Checking if identifier is a valid phone number');
      try {
        console.log('Attempting to format phone number:', value);
        const formattedNumber = smsService.formatPhoneNumber(value);
        console.log('Formatted phone number:', formattedNumber);
        const isValid = smsService.isValidPhoneNumber(formattedNumber);
        console.log('Is valid phone number?', isValid);
        if (!isValid) {
          throw new Error('Please provide a valid phone number');
        }
        return isValid;
      } catch (error) {
        console.error('Error validating phone number:', error);
        throw new Error('Please provide a valid phone number in format +1234567890');
      }
    }),
  body('type')
    .optional()
    .isIn(Object.values(OTP_TYPES))
    .withMessage('Invalid OTP type')
];

const verifyOTPValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(async (value, { req }) => {
      if (!value) return false;
      try {
        const formattedNumber = smsService.formatPhoneNumber(value);
        return smsService.isValidPhoneNumber(formattedNumber);
      } catch (error) {
        throw new Error('Please provide a valid phone number');
      }
    }),
  body('otp')
    .isLength({ min: 4, max: 8 })
    .withMessage('OTP must be between 4 and 8 characters')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('type')
    .optional()
    .isIn(Object.values(OTP_TYPES))
    .withMessage('Invalid OTP type'),
  body('verificationId')
    .optional()
    .isString()
    .withMessage('Verification ID must be a string')
];

/**
 * @route   POST /api/v1/otp/request
 * @desc    Request a new OTP via SMS
 * @access  Public
 * @body    {string} identifier - User's phone number with country code
 * @body    {string} [type=login] - Type of OTP (login, register, reset_password, etc.)
 * @returns {Object} Success message and expiration time
 */
router.post(
  '/request',
  [
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5, // limit each IP to 5 OTP requests per hour
      message: 'Too many OTP requests, please try again later',
      skip: (req) => {
        // Skip rate limiting for whitelisted IPs
        const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
        return whitelist.includes(req.ip);
      }
    }),
    ...requestOTPValidation,
    validateRequest
  ],
  async(req, res, next) => {
    try {
      const { identifier, type = OTP_TYPES.LOGIN } = req.body;

      // Generate and store OTP
      const result = await otpService.generateAndStoreOTP(type, identifier, {
        deliveryMethod: OTP_DELIVERY_METHODS.SMS,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      // In production, OTP is sent via SMS automatically
      if (process.env.NODE_ENV === 'production' || result.testMode) {
        res.json({
          success: true,
          message: 'OTP sent successfully via SMS',
          expiresAt: result.expiresAt,
          method: 'sms',
          testMode: result.testMode || false
        });
      } else {
        // In development, return the OTP for testing
        res.json({
          success: true,
          message: 'OTP generated (development mode)',
          otp: result.otp,
          expiresAt: result.expiresAt,
          method: 'sms',
          testMode: true
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/otp/verify
 * @desc    Verify an OTP received via SMS
 * @access  Public
 * @body    {string} identifier - User's phone number with country code
 * @body    {string} otp - The OTP code received via SMS
 * @body    {string} [type=login] - Type of OTP (login, register, reset_password, etc.)
 * @returns {Object} Verification result with JWT tokens
 */
router.post(
  '/verify',
  [
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 verification attempts per 15 minutes
      message: 'Too many verification attempts, please try again later'
    }),
    ...verifyOTPValidation,
    validateRequest
  ],
  async(req, res, next) => {
    try {
      const { identifier, otp, type = OTP_TYPES.LOGIN, verificationId } = req.body;
      
      // Add null checks for identifier
      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Identifier (email or phone) is required'
          }
        });
      }
      
      if (typeof identifier !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Identifier must be a string'
          }
        });
      }
      
      const isEmail = identifier.includes('@');

      // Verify OTP
      const result = await otpService.verifyOTP(type, identifier, otp);

      if (result.valid) {
        // Unified login/registration flow
        const phoneNumber = isEmail ? null : identifier;

        let user = null;
        if (phoneNumber) {
          user = await User.findByPhone(phoneNumber);
        }

        if (!user) {
          // New Rider – create account
          user = await User.create({
            phoneNumber,
            isPhoneVerified: true,
            isRegistered: true,
            lastLogin: new Date()
          });
        } else {
          // Returning Pro – update verification + login timestamp
          if (!user.isPhoneVerified) user.isPhoneVerified = true;
          user.lastLogin = new Date();
          await user.save();
        }

        // Issue JWT tokens
        const { accessToken, refreshToken, expiresIn, tokenType } = JWT.generateTokenPair(user);

        return res.json({
          success: true,
          message: 'Authentication successful',
          tokenType,
          accessToken,
          refreshToken,
          expiresIn,
          user
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          remainingAttempts: result.remainingAttempts,
          error: result.code || 'INVALID_OTP'
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/v1/otp/resend
 * @desc    Resend OTP
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} [type=login] - Type of OTP (login, register, reset_password, etc.)
 * @returns {Object} Success message and new expiration time
 */
router.post(
  '/resend',
  [
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // limit to 3 resend attempts per hour
      message: 'Too many resend attempts, please try again later'
    }),
    ...requestOTPValidation,
    validateRequest
  ],
  async(req, res, next) => {
    try {
      const { identifier, type = OTP_TYPES.LOGIN } = req.body;

      // This will generate a new OTP, invalidating the previous one
      const result = await otpService.generateAndStoreOTP(type, identifier, {
        deliveryMethod: OTP_DELIVERY_METHODS.SMS,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          isResend: true
        }
      });

      // In production, OTP is sent via SMS automatically
      if (process.env.NODE_ENV === 'production' || result.testMode) {
        res.json({
          success: true,
          message: 'New OTP sent successfully via SMS',
          expiresAt: result.expiresAt,
          method: 'sms',
          testMode: result.testMode || false
        });
      } else {
        // In development, return the OTP for testing
        res.json({
          success: true,
          message: 'New OTP generated (development mode)',
          otp: result.otp,
          expiresAt: result.expiresAt,
          method: 'sms',
          testMode: true
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to determine if an identifier is an email or phone number
function getIdentifierType(identifier) {
  if (identifier.includes('@')) {
    return { type: 'email', value: identifier };
  }

  // Clean and format phone number
  const digits = identifier.replace(/\D/g, '');
  return {
    type: 'phone',
    value: digits.startsWith('+') ? identifier : `+${digits}`
  };
}

export default router;
