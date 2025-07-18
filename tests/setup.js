// Test Environment Setup
import { jest } from '@jest/globals';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = 'test-private-key';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';

// Mock Firebase Admin SDK
jest.unstable_mockModule('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(() => ({})),
    applicationDefault: jest.fn(() => ({}))
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ 
            id: 'test-id', 
            phoneNumber: '+1234567890',
            verified: false,
            createdAt: new Date()
          })
        })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({
          empty: false,
          docs: [{ 
            id: 'test-id', 
            data: () => ({ 
              id: 'test-id',
              phoneNumber: '+1234567890' 
            })
          }]
        }))
      }))
    }))
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({ uid: 'test-uid' })),
    createUser: jest.fn(() => Promise.resolve({ uid: 'test-uid' })),
    updateUser: jest.fn(() => Promise.resolve()),
    deleteUser: jest.fn(() => Promise.resolve())
  }))
}));

// Mock Twilio
jest.unstable_mockModule('twilio', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({
        sid: 'test-message-sid',
        status: 'sent',
        to: '+1234567890',
        from: '+1234567890',
        body: 'Test message'
      }))
    }
  }))
}));

// Mock Redis
jest.unstable_mockModule('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve('test-value')),
    set: jest.fn(() => Promise.resolve()),
    setex: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
    quit: jest.fn(() => Promise.resolve()),
    isOpen: true,
    isReady: true
  }))
}));

// Mock Mongoose
jest.unstable_mockModule('mongoose', () => ({
  connect: jest.fn(() => Promise.resolve()),
  connection: {
    close: jest.fn(() => Promise.resolve()),
    readyState: 1
  },
  Schema: jest.fn(),
  model: jest.fn(() => ({
    find: jest.fn(() => Promise.resolve([])),
    findOne: jest.fn(() => Promise.resolve({})),
    findById: jest.fn(() => Promise.resolve({})),
    create: jest.fn(() => Promise.resolve({})),
    updateOne: jest.fn(() => Promise.resolve({})),
    deleteOne: jest.fn(() => Promise.resolve({}))
  }))
}));

// Global test setup
beforeAll(() => {
  // Suppress console.log during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(async () => {
  // Clean up any remaining timers
  jest.clearAllTimers();
  jest.useRealTimers();
}); 