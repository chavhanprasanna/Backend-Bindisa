import 'express-async-errors';
import http from 'http';
import mongoose from 'mongoose';
import config from './config/env.js';
import app from './app.js';
import logger from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';
import { initializeRedis } from './utils/cache.js';

// Set mongoose options
mongoose.set('bufferCommands', false);
mongoose.set('strictQuery', true);
mongoose.set('debug', config.NODE_ENV === 'development');

// Create HTTP server
const server = http.createServer(app);
const { PORT, HOST, MONGODB_URI, NODE_ENV } = config;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // In production, you might want to perform some cleanup before exiting
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to perform some cleanup before exiting
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async() => {
  logger.info('SIGTERM received. Shutting down gracefully...');

  try {
    // Close the server
    server.close(async() => {
      logger.info('HTTP server closed');

      // Close database connection
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');

      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
const startServer = async() => {
  try {
    // 1. Connect to MongoDB first
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info('✅ MongoDB connected');

    // 2. Initialize Redis cache
    await initializeRedis();
    logger.info('✅ Cache initialization completed');

    // 3. Start listening only after all dependencies are ready
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running in ${NODE_ENV} mode on http://${HOST}:${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

export default server;
