import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), process.env.NODE_ENV === 'test' ? '.env.test' : '.env')
});

// Define configuration with default values
const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || '0.0.0.0',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bindisa',

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your_jwt_access_secret_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE || '15m',  // 15 minutes
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',  // 7 days

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'bindisa-a6f5f',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ?
    process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || 'AIzaSyA9mV5xu4WPvnwQU6KXYForvxJ5QXeJwRY',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'bindisa-a6f5f.firebasestorage.app',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '1:469520984478:android:142e8e908692124c9e4e8f',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'your_session_secret',
  SESSION_EXPIRE: parseInt(process.env.SESSION_EXPIRE || '86400', 10) // 24 hours
};

// Validate required environment variables
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

// Check for missing required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

// In production, abort if required env vars are missing
if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

export default config;
