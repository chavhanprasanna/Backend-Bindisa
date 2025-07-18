import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9mV5xu4WPvnwQU6KXYForvxJ5QXeJwRY",
  authDomain: "bindisa-a6f5f.firebaseapp.com",
  projectId: "bindisa-a6f5f",
  storageBucket: "bindisa-a6f5f.firebasestorage.app",
  messagingSenderId: "469520984478"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set up reCAPTCHA verifier
let appVerifier;
const setupRecaptcha = (containerId = 'recaptcha-container') => {
  appVerifier = new RecaptchaVerifier(containerId, {
    size: 'invisible',
  }, auth);
};

export { auth, appVerifier, setupRecaptcha };
