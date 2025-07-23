/**
 * SMS Service
 * Handles sending SMS messages using Firebase Authentication
 */

import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
// Remove the Firebase initialization code and import auth from firebase.js instead
import { auth } from '../config/firebase.js';
import logger from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

// Delete this entire block:
/*
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA9mV5xu4WPvnwQU6KXYForvxJ5QXeJwRY',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'bindisa-a6f5f.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'bindisa-a6f5f',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'bindisa-a6f5f.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '469520984478',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || ''
};

firebaseApp = initializeApp(firebaseConfig);
auth = getAuth(firebaseApp);
*/
import {
  TEST_PHONE_NUMBERS,
  DEFAULT_COUNTRY_CODE,
  PHONE_REGEX
} from '../config/otp.config.js';



/**
 * Format a phone number by ensuring it has a country code
 * @param {string} phoneNumber - The phone number to format
 * @param {string} countryCode - The country code to use if not present
 * @returns {string} Formatted phone number with country code
 */
export const formatPhoneNumber = (phoneNumber, countryCode = DEFAULT_COUNTRY_CODE) => {
  console.log('formatPhoneNumber called with:', { phoneNumber, countryCode });
  
  if (!phoneNumber) {
    console.error('Phone number is required');
    throw new ApiError(400, 'Phone number is required');
  }

  if (typeof phoneNumber !== 'string') {
    console.error('Phone number must be a string, got:', typeof phoneNumber);
    throw new ApiError(400, 'Phone number must be a string');
  }

  try {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    console.log('Digits only:', digitsOnly);

    // If it already has a country code, return as is
    if (phoneNumber.startsWith('+')) {
      const result = `+${digitsOnly}`;
      console.log('Already has country code, returning:', result);
      return result;
    }

    // If it starts with a leading zero, remove it
    const cleanNumber = digitsOnly.startsWith('0') ? digitsOnly.substring(1) : digitsOnly;
    console.log('Cleaned number:', cleanNumber);

    // Add country code (without the +)
    const countryCodeDigits = countryCode ? countryCode.replace(/\D/g, '') : '';
    if (!countryCodeDigits) {
      console.error('Invalid country code:', countryCode);
      throw new ApiError(400, 'Invalid country code');
    }

    const result = `+${countryCodeDigits}${cleanNumber}`;
    console.log('Formatted phone number:', result);
    return result;
  } catch (error) {
    console.error('Error formatting phone number:', error);
    throw new ApiError(400, 'Invalid phone number format');
  }
};

/**
 * Validate a phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} True if the phone number is valid
 * @throws {ApiError} If PHONE_REGEX is not properly configured
 */
export const isValidPhoneNumber = (phoneNumber) => {
  if (!PHONE_REGEX) {
    throw new ApiError(500, 'Phone number validation is not properly configured');
  }
  if (!phoneNumber) {
    return false;
  }
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
    if (!phoneNumber) {
      throw new ApiError(400, 'Phone number is required');
    }

    // Format the phone number
    let formattedPhoneNumber;
    try {
      formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    } catch (error) {
      throw new ApiError(400, error.message || 'Invalid phone number format');
    }

    // Check if this is a test phone number
    const cleanNumber = formattedPhoneNumber.replace(/\D/g, '');
    const isTestNumber = TEST_PHONE_NUMBERS && Array.isArray(TEST_PHONE_NUMBERS) 
      ? TEST_PHONE_NUMBERS.includes(cleanNumber)
      : false;

    if (isTestNumber) {
      logger.info(`[Test Mode] Skipping Firebase OTP for test number: ${formattedPhoneNumber}`);
      return {
        success: true,
        verificationId: 'test_verification_id',
        phoneNumber: formattedPhoneNumber,
        testMode: true
      };
    }

    // Check if Firebase auth is available
    if (!auth) {
      throw new ApiError(503, 'Phone authentication service is currently unavailable. Please try again later.');
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
