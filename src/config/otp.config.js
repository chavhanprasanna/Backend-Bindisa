/**
 * OTP Configuration
 * Configuration settings for OTP generation and verification
 */

// OTP length (number of digits)
export const OTP_LENGTH = parseInt(process.env.OTP_LENGTH || '6', 10);

// OTP expiry time in seconds (default: 10 minutes)
export const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY || '600', 10);

// Phone OTP expiry time in seconds (default: 5 minutes)
export const PHONE_OTP_EXPIRY = parseInt(process.env.PHONE_OTP_EXPIRY || '300', 10);

// Maximum number of OTP verification attempts
export const OTP_ATTEMPTS_LIMIT = parseInt(process.env.OTP_ATTEMPTS_LIMIT || '3', 10);

// Delay between OTP resend requests in seconds (rate limiting)
export const OTP_RESEND_DELAY = parseInt(process.env.OTP_RESEND_DELAY || '30', 10);

// Phone OTP resend delay in seconds (longer than email)
export const PHONE_OTP_RESEND_DELAY = parseInt(process.env.PHONE_OTP_RESEND_DELAY || '60', 10);

// Test phone numbers that bypass SMS sending (for development)
export const TEST_PHONE_NUMBERS = (process.env.TEST_PHONE_NUMBERS || '')
  .split(',')
  .map(phone => phone.trim())
  .filter(Boolean);

// Default country code for phone numbers
export const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '+91';

// Phone number validation regex
export const PHONE_REGEX = /^[+]?[0-9]{10,15}$/;

// OTP types for different operations
export const OTP_TYPES = {
  // Email OTPs
  LOGIN: 'login',
  REGISTER: 'register',
  RESET_PASSWORD: 'reset_password',
  EMAIL_VERIFICATION: 'email_verification',

  // Phone OTPs
  PHONE_VERIFICATION: 'phone_verification',
  PHONE_LOGIN: 'phone_login',
  PHONE_UPDATE: 'phone_update',

  // 2FA
  TWO_FACTOR_AUTH: '2fa',

  // General purpose
  VERIFICATION: 'verification'
};

// OTP delivery methods
export const OTP_DELIVERY_METHODS = {
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp'
};

// Default OTP template names for different operations
export const OTP_TEMPLATES = {
  [OTP_TYPES.LOGIN]: 'login-otp',
  [OTP_TYPES.REGISTER]: 'welcome-otp',
  [OTP_TYPES.RESET_PASSWORD]: 'reset-password-otp',
  [OTP_TYPES.EMAIL_VERIFICATION]: 'email-verification-otp',
  [OTP_TYPES.PHONE_VERIFICATION]: 'phone-verification-otp',
  [OTP_TYPES.TWO_FACTOR_AUTH]: '2fa-otp'
};

// Default OTP email subjects
export const OTP_EMAIL_SUBJECTS = {
  [OTP_TYPES.LOGIN]: 'Your Login Verification Code',
  [OTP_TYPES.REGISTER]: 'Welcome! Verify Your Account',
  [OTP_TYPES.RESET_PASSWORD]: 'Reset Your Password',
  [OTP_TYPES.EMAIL_VERIFICATION]: 'Verify Your Email Address',
  [OTP_TYPES.PHONE_VERIFICATION]: 'Verify Your Phone Number',
  [OTP_TYPES.TWO_FACTOR_AUTH]: 'Your Two-Factor Authentication Code'
};

// Default OTP SMS messages
export const OTP_SMS_MESSAGES = {
  [OTP_TYPES.LOGIN]: (otp) => `Your login code is ${otp}. Valid for 10 minutes.`,
  [OTP_TYPES.REGISTER]: (otp) => `Welcome! Your verification code is ${otp}.`,
  [OTP_TYPES.RESET_PASSWORD]: (otp) => `Your password reset code is ${otp}.`,
  [OTP_TYPES.EMAIL_VERIFICATION]: (otp) => `Your email verification code is ${otp}.`,
  [OTP_TYPES.PHONE_VERIFICATION]: (otp) => `Your phone verification code is ${otp}.`,
  [OTP_TYPES.TWO_FACTOR_AUTH]: (otp) => `Your 2FA code is ${otp}.`
};

// OTP rate limiting configuration
export const OTP_RATE_LIMIT = {
  // Maximum number of OTP requests per IP per hour
  MAX_REQUESTS_PER_HOUR: parseInt(process.env.OTP_MAX_REQUESTS_PER_HOUR || '10', 10),

  // Block duration in seconds after exceeding the limit
  BLOCK_DURATION: parseInt(process.env.OTP_BLOCK_DURATION || '3600', 10) // 1 hour
};

// Export all configurations as a single object
export default {
  OTP_LENGTH,
  OTP_EXPIRY,
  OTP_ATTEMPTS_LIMIT,
  OTP_RESEND_DELAY,
  OTP_TYPES,
  OTP_DELIVERY_METHODS,
  OTP_TEMPLATES,
  OTP_EMAIL_SUBJECTS,
  OTP_SMS_MESSAGES,
  OTP_RATE_LIMIT
};
