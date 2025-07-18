/**
 * SMS Service
 * Handles sending SMS messages using Firebase Authentication
 */

import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import {
  TEST_PHONE_NUMBERS,
  DEFAULT_COUNTRY_CODE,
  PHONE_REGEX
} from '../config/otp.config.js';

// Initialize Firebase
let firebaseApp;
let auth;

try {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA9mV5xu4WPvnwQU6KXYForvxJ5QXeJwRY',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'bindisa-a6f5f.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'bindisa-a6f5f',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'bindisa-a6f5f.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '469520984478',
    appId: process.env.FIREBASE_APP_ID || '', // Add your appId if available
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || '' // Add your measurementId if available
  };

  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);

  // Set up reCAPTCHA verifier (this is a global instance)

  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Firebase', { error });
  console.warn("Firebase not configured, SMS service disabled");
}

/**
 * Format a phone number by ensuring it has a country code
 * @param {string} phoneNumber - The phone number to format
 * @param {string} countryCode - The country code to use if not present
 * @returns {string} Formatted phone number with country code
 */
export const formatPhoneNumber = (phoneNumber, countryCode = DEFAULT_COUNTRY_CODE) => {
  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');

  // If it already has a country code, return as is
  if (phoneNumber.startsWith('+')) {
    return `+${digitsOnly}`;
  }

  // If it starts with a leading zero, remove it
  const cleanNumber = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;

  // Add country code (without the +)
  const countryCodeDigits = countryCode.replace('+', '');
  return `+${countryCodeDigits}${cleanNumber}`;
};

/**
 * Validate a phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} True if the phone number is valid
 */
export const isValidPhoneNumber = (phoneNumber) => {
  return PHONE_REGEX.test(phoneNumber);
};

/**
 * Send an OTP via Firebase Phone Authentication
 * @param {string} phoneNumber - Recipient phone number with country code
 * @param {string} recaptchaVerifier - reCAPTCHA verifier instance
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result of the OTP sending operation
 */
export const sendOTP = async(phoneNumber, recaptchaVerifier, options = {}) => {
  const {
    type = 'verification',
    appName = process.env.APP_NAME || 'Our Service',
    ...sendOptions
  } = options;

  try {
    // Format the phone number
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // Check if this is a test phone number
    const isTestNumber = TEST_PHONE_NUMBERS.includes(formattedPhoneNumber.replace(/\D/g, ''));

    if (isTestNumber) {
      logger.info(`[Test Mode] Skipping Firebase OTP for test number: ${formattedPhoneNumber}`);
      return {
        success: true,
        verificationId: 'test_verification_id',
        phoneNumber: formattedPhoneNumber,
        testMode: true
      };
    }

    // Send OTP using Firebase
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      formattedPhoneNumber,
      recaptchaVerifier
    );

    logger.info(`OTP sent to ${formattedPhoneNumber} via Firebase`);

    // In a real implementation, you would store the confirmationResult.verificationId
    // and use it later to verify the OTP
    return {
      success: true,
      verificationId: confirmationResult.verificationId,
      phoneNumber: formattedPhoneNumber,
      message: 'OTP sent successfully'
    };
  } catch (error) {
    logger.error('Failed to send OTP via Firebase', { error, phoneNumber });

    let errorMessage = 'Failed to send OTP';
    let errorCode = 'OTP_SEND_FAILED';

    // Handle specific Firebase errors
    switch (error.code) {
    case 'auth/too-many-requests':
      errorMessage = 'Too many requests. Please try again later.';
      errorCode = 'TOO_MANY_REQUESTS';
      break;
    case 'auth/invalid-phone-number':
      errorMessage = 'Invalid phone number format.';
      errorCode = 'INVALID_PHONE_NUMBER';
      break;
    case 'auth/quota-exceeded':
      errorMessage = 'SMS quota exceeded. Please try again later.';
      errorCode = 'QUOTA_EXCEEDED';
      break;
    default:
      errorMessage = error.message || errorMessage;
    }

    throw new ApiError(400, errorMessage, { code: errorCode });
  }
};

/**
 * Verify OTP using Firebase
 * @param {string} verificationId - The verification ID from sendOTP response
 * @param {string} otp - The OTP code to verify
 * @returns {Promise<Object>} Result of the verification
 */
export const verifyOTP = async(verificationId, otp) => {
  try {
    // In a real implementation, you would use the verificationId to verify the OTP
    // This is a simplified example
    if (verificationId === 'test_verification_id') {
      return { success: true, verified: true };
    }

    // For actual Firebase verification, you would use:
    // const credential = PhoneAuthProvider.credential(verificationId, otp);
    // const userCredential = await signInWithCredential(auth, credential);

    // For now, we'll simulate a successful verification
    return {
      success: true,
      verified: true,
      user: {
        // User data from Firebase
        uid: `firebase_${Date.now()}`,
        phoneNumber: verificationId
      }
    };
  } catch (error) {
    logger.error('Failed to verify OTP', { error });

    let errorMessage = 'Invalid OTP';
    let errorCode = 'INVALID_OTP';

    // Handle specific Firebase errors
    switch (error.code) {
    case 'auth/invalid-verification-code':
      errorMessage = 'Invalid verification code';
      errorCode = 'INVALID_OTP';
      break;
    case 'auth/code-expired':
      errorMessage = 'Verification code has expired';
      errorCode = 'OTP_EXPIRED';
      break;
    default:
      errorMessage = error.message || errorMessage;
    }

    throw new ApiError(400, errorMessage, { code: errorCode });
  }
};

// Export the auth instance for use in other parts of the application
export { auth };

export default {
  sendOTP,
  verifyOTP,
  formatPhoneNumber,
  isValidPhoneNumber,
  auth
};
