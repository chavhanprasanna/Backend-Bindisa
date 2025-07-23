import admin from 'firebase-admin';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import fs from 'fs';
import path from 'path';

let auth;

// Initialize Firebase Admin SDK
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    const serviceAccountPath = path.resolve(
      process.cwd(), 
      'src/config/bindisa-agritech-firebase-adminsdk-fbsvc-719574e148.json'
    );
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount), // Changed this line
      databaseURL: "https://bindisa-a6f5f.firebaseio.com"
    });
    console.log('✅ Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  if (error.code === 'ENOENT') {
    console.error('  - Make sure the service account file exists at the specified path');
    console.error('  - Check file permissions');
  } else if (error.code === 'EACCES') {
    console.error('  - Permission denied when accessing the service account file');
  }
  
  // Graceful degradation - don't crash the app
  console.warn('⚠️  Firebase Admin will not be available. Some features may be limited.');
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Firebase is required in production. Please check your configuration.');
  }
}

// Initialize Firebase Client SDK
try {
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  // Add this if you're using Firebase Cloud Messaging
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
    // appId is optional for server-side usage
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  console.log('✅ Firebase Client initialized successfully');
  console.log('   - Project ID:', firebaseConfig.projectId);
  console.log('   - Auth Domain:', firebaseConfig.authDomain);
  
} catch (error) {
  console.error('❌ Failed to initialize Firebase Client:', error.message);
  if (error.code === 'app/duplicate-app') {
    console.error('  - Firebase app already initialized');
  } else if (error.code === 'app/invalid-credential') {
    console.error('  - Invalid Firebase configuration');
  }
  
  // Graceful degradation for client SDK
  console.warn('⚠️  Firebase Client will not be available. Phone authentication may not work.');
  auth = null; // Set to null for safe checking
  
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Firebase Client is required in production for phone authentication.');
  }
}

export { admin, auth };
