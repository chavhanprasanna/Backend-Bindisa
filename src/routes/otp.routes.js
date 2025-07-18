import express from 'express';
import otpService from '../services/otp.service.js';
import {
  OTP_TYPES,
  OTP_DELIVERY_METHODS,
  PHONE_REGEX,
  DEFAULT_COUNTRY_CODE
} from '../config/otp.config.js';
import { rateLimit } from '../utils/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import { body } from 'express-validator';
import { RecaptchaVerifier } from 'firebase/auth';
import { auth as firebaseAuth } from '../services/sms.service.js';
import User from '../models/User.js';
import JWT from '../utils/jwt.js';
import ApiError from '../utils/apiError.js';

const router = express.Router();

// Input validation schemas
const requestOTPValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = PHONE_REGEX.test(value);

      if (!isEmail && !isPhone) {
        throw new Error('Please provide a valid email address or phone number');
      }
      return true;
    }),
  body('type')
    .optional()
    .isIn(Object.values(OTP_TYPES))
    .withMessage('Invalid OTP type'),
  body('recaptchaToken')
    .optional()
    .isString()
    .withMessage('reCAPTCHA token must be a string')
];

const verifyOTPValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone number is required'),
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
 * @desc    Request a new OTP
 * @access  Public
 * @body    {string} email - User's email address
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
      const { identifier, type = OTP_TYPES.LOGIN, recaptchaToken } = req.body;
      const isEmail = identifier.includes('@');

      // For phone numbers, we need to verify reCAPTCHA
      let recaptchaVerifier = null;
      if (!isEmail) {
        if (!recaptchaToken) {
          throw new ApiError(400, 'reCAPTCHA token is required for phone verification');
        }

        // In a real implementation, you would verify the reCAPTCHA token
        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          size: 'invisible',
          'token': recaptchaToken
        });
      }

      // Generate and store OTP
      const result = await otpService.generateAndStoreOTP(type, identifier, {
        deliveryMethod: isEmail ? OTP_DELIVERY_METHODS.EMAIL : OTP_DELIVERY_METHODS.SMS,
        recaptchaVerifier,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      // In production, OTP is sent via email/SMS automatically
      if (process.env.NODE_ENV === 'production' || result.testMode) {
        res.json({
          success: true,
          message: 'OTP sent successfully',
          expiresAt: result.expiresAt,
          method: isEmail ? 'email' : 'sms',
          testMode: result.testMode || false
        });
      } else {
        // In development, return the OTP for testing
        res.json({
          success: true,
          message: 'OTP generated (development mode)',
          otp: result.otp,
          expiresAt: result.expiresAt,
          method: isEmail ? 'email' : 'sms',
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
 * @desc    Verify an OTP
 * @access  Public
 * @body    {string} email - User's email address
 * @body    {string} otp - The OTP to verify
 * @body    {string} [type=login] - Type of OTP (login, register, reset_password, etc.)
 * @returns {Object} Verification result
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
      const { identifier, type = OTP_TYPES.LOGIN, recaptchaToken } = req.body;
      const isEmail = identifier.includes('@');

      // For phone numbers, we need to verify reCAPTCHA
      let recaptchaVerifier = null;
      if (!isEmail) {
        if (!recaptchaToken) {
          throw new ApiError(400, 'reCAPTCHA token is required for phone verification');
        }

        // In a real implementation, you would verify the reCAPTCHA token
        recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
          size: 'invisible',
          'token': recaptchaToken
        });
      }

      // This will generate a new OTP, invalidating the previous one
      const result = await otpService.generateAndStoreOTP(type, identifier, {
        deliveryMethod: isEmail ? OTP_DELIVERY_METHODS.EMAIL : OTP_DELIVERY_METHODS.SMS,
        recaptchaVerifier,
        metadata: {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          isResend: true
        }
      });

      // In production, OTP is sent via email/SMS automatically
      if (process.env.NODE_ENV === 'production' || result.testMode) {
        res.json({
          success: true,
          message: 'New OTP sent successfully',
          expiresAt: result.expiresAt,
          method: isEmail ? 'email' : 'sms',
          testMode: result.testMode || false
        });
      } else {
        // In development, return the OTP for testing
        res.json({
          success: true,
          message: 'New OTP generated (development mode)',
          otp: result.otp,
          expiresAt: result.expiresAt,
          method: isEmail ? 'email' : 'sms',
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
