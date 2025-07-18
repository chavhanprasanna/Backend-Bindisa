import admin from 'firebase-admin';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import fs from 'fs';
import path from 'path';

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  const serviceAccountPath = path.resolve(process.cwd(), 'src/controllers/bindisa-agritech-firebase-adminsdk-fbsvc-b68fc82596.json');
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Initialize Firebase Client SDK
const firebaseConfig = {
  apiKey: 'AIzaSyA9mV5xu4WPvnwQU6KXYForvxJ5QXeJwRY',
  authDomain: 'bindisa-a6f5f.firebaseapp.com',
  projectId: 'bindisa-a6f5f',
  storageBucket: 'bindisa-a6f5f.firebasestorage.app',
  messagingSenderId: '469520984478'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { admin, auth };
