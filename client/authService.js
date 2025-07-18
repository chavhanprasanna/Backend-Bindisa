import { auth, appVerifier, setupRecaptcha } from './firebase';
import { signInWithPhoneNumber } from 'firebase/auth';

class AuthService {
  constructor() {
    this.confirmationResult = null;
    this.setupRecaptcha();
  }

  setupRecaptcha(containerId = 'recaptcha-container') {
    try {
      setupRecaptcha(containerId);
      return true;
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error);
      return false;
    }
  }

  async sendOtp(phoneNumber) {
    try {
      // Format phone number to include country code if not present
      const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      // Send OTP
      this.confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) || 'Failed to send OTP' 
      };
    }
  }

  async verifyOtp(otp) {
    try {
      if (!this.confirmationResult) {
        throw new Error('No OTP request found');
      }

      const result = await this.confirmationResult.confirm(otp);
      const user = result.user;
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      return { 
        success: true, 
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          email: user.email || null
        },
        idToken
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { 
        success: false, 
        message: this.getErrorMessage(error.code) || 'Invalid OTP' 
      };
    }
  }

  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/missing-phone-number': 'Phone number is required',
      'auth/quota-exceeded': 'SMS quota exceeded. Please try again later.',
      'auth/code-expired': 'The verification code has expired. Please request a new one.',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  }

  // Sign out the current user
  async signOut() {
    try {
      await auth.signOut();
      this.confirmationResult = null;
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, message: 'Failed to sign out' };
    }
  }

  // Get the current user
  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      }, (error) => {
        console.error('Auth state error:', error);
        resolve(null);
      });
    });
  }
}

export default new AuthService();
