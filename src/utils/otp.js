import { auth } from '../config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Store verification IDs
const verificationIds = new Map();

export async function sendOtp(phoneNumber) {
  try {
    // Format phone number to include country code if not present
    const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    // Initialize reCAPTCHA verifier
    const appVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });

    // Send OTP using Firebase Authentication
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);

    // Store the verification ID
    verificationIds.set(phoneNumber, confirmationResult.verificationId);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP');
  }
}

export async function verifyOtp(phoneNumber, otp) {
  try {
    const verificationId = verificationIds.get(phoneNumber);
    if (!verificationId) {
      throw new Error('No OTP request found for this number');
    }

    // In a real implementation, you would verify the OTP using the verificationId and OTP
    // For Firebase, we'd typically handle this on the client side, but for backend verification,
    // we can use the Firebase Admin SDK to verify the token

    // For now, we'll keep a simple verification for demonstration
    // In production, you should implement proper verification using Firebase Admin SDK
    const userCredential = await auth.signInWithPhoneNumber(verificationId, otp);

    if (userCredential) {
      // Clear the verification ID after successful verification
      verificationIds.delete(phoneNumber);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new Error('Invalid OTP or verification failed');
  }
}

// For backward compatibility
export const sendOtpMock = sendOtp;
export const verifyOtpMock = verifyOtp;
