export default {
  testEnvironment: 'node',
  testTimeout: 30000,
  collectCoverage: false,
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleFileExtensions: ['js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/setup.js'],
  verbose: true
};
