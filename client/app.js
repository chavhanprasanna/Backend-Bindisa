import AuthService from './authService.js';

// DOM Elements
const phoneForm = document.getElementById('phone-form');
const otpContainer = document.getElementById('otp-container');
const phoneInput = document.getElementById('phone');
const otpInput = document.getElementById('otp');
const sendOtpBtn = document.getElementById('send-otp');
const verifyOtpBtn = document.getElementById('verify-otp');
const resendOtpLink = document.getElementById('resend-otp');
const phoneError = document.getElementById('phone-error');
const otpError = document.getElementById('otp-error');
const otpSuccess = document.getElementById('otp-success');

// Initialize the app
function init() {
  // Check if user is already logged in
  checkAuthState();
  
  // Event Listeners
  sendOtpBtn.addEventListener('click', handleSendOtp);
  verifyOtpBtn.addEventListener('click', handleVerifyOtp);
  resendOtpLink.addEventListener('click', handleResendOtp);
}

// Check if user is already authenticated
async function checkAuthState() {
  const user = await AuthService.getCurrentUser();
  if (user) {
    // User is already logged in, redirect to dashboard
    window.location.href = '/dashboard.html';
  }
}

// Handle Send OTP
async function handleSendOtp(e) {
  e.preventDefault();
  
  const phoneNumber = phoneInput.value.trim();
  
  if (!phoneNumber) {
    showError(phoneError, 'Phone number is required');
    return;
  }
  
  // Show loading state
  sendOtpBtn.disabled = true;
  sendOtpBtn.textContent = 'Sending...';
  
  try {
    const result = await AuthService.sendOtp(phoneNumber);
    
    if (result.success) {
      // Hide phone form, show OTP form
      phoneForm.style.display = 'none';
      otpContainer.style.display = 'block';
      otpInput.focus();
    } else {
      showError(phoneError, result.message);
      sendOtpBtn.disabled = false;
      sendOtpBtn.textContent = 'Send OTP';
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    showError(phoneError, 'Failed to send OTP. Please try again.');
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = 'Send OTP';
  }
}

// Handle Verify OTP
async function handleVerifyOtp() {
  const otp = otpInput.value.trim();
  
  if (!otp || otp.length !== 6) {
    showError(otpError, 'Please enter a valid 6-digit OTP');
    return;
  }
  
  // Show loading state
  verifyOtpBtn.disabled = true;
  verifyOtpBtn.textContent = 'Verifying...';
  
  try {
    const result = await AuthService.verifyOtp(otp);
    
    if (result.success) {
      // OTP verified successfully
      otpError.textContent = '';
      otpSuccess.textContent = 'OTP verified successfully! Redirecting...';
      
      // Send the ID token to your backend for authentication
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: result.idToken,
          phoneNumber: result.user.phoneNumber
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store tokens and redirect
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } else {
      showError(otpError, result.message);
      verifyOtpBtn.disabled = false;
      verifyOtpBtn.textContent = 'Verify OTP';
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    showError(otpError, error.message || 'Failed to verify OTP');
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = 'Verify OTP';
  }
}

// Handle Resend OTP
async function handleResendOtp(e) {
  e.preventDefault();
  
  const phoneNumber = phoneInput.value.trim();
  if (!phoneNumber) {
    showError(otpError, 'Phone number is required');
    return;
  }
  
  try {
    const result = await AuthService.sendOtp(phoneNumber);
    if (result.success) {
      showSuccess(otpSuccess, 'OTP resent successfully!');
    } else {
      showError(otpError, result.message);
    }
  } catch (error) {
    console.error('Error resending OTP:', error);
    showError(otpError, 'Failed to resend OTP. Please try again.');
  }
}

// Helper function to show error messages
function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
  
  // Hide error after 5 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}

// Helper function to show success messages
function showSuccess(element, message) {
  element.textContent = message;
  element.style.display = 'block';
  
  // Hide success message after 3 seconds
  setTimeout(() => {
    element.style.display = 'none';
  }, 3000);
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
