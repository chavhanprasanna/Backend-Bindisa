import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import configurations
import config from './config/env.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import securityMiddleware from './middlewares/security.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import farmRoutes from './routes/farm.routes.js';
import cycleRoutes from './routes/cropCycleRoutes.js';
import testRoutes from './routes/soilTestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import bugReportRoutes from './routes/bugReportRoutes.js';
import supportChatRoutes from './routes/supportChatRoutes.js';
import cropSuggestionRoutes from './routes/cropSuggestionRoutes.js';
import profitEntryRoutes from './routes/profitEntryRoutes.js';
import offlineSyncRoutes from './routes/offlineSyncRoutes.js';
import videoTutorialRoutes from './routes/videoTutorialRoutes.js';
import locationRoutes from './routes/location.routes.js';
import otpRoutes from './routes/otp.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Initialize express app
const app = express();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Trust first proxy (important for rate limiting and secure cookies)
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Apply security middleware
app.use(securityMiddleware);

// Enable CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization', 'X-Refresh-Token']
}));

// Parse JSON request body
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
  ]
}));

// Compress all responses
app.use(compression());

// Rate limiting
app.use('/api', apiLimiter);

// Logging middleware in development
if (config.NODE_ENV === 'development') {
  const morgan = await import('morgan');
  app.use(morgan.default('dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Bindisa Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    endpoints: {
      health: '/status',
      api: '/api/v1'
    }
  });
});

// Health check endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version
  });
});

// API routes
const apiRouter = express.Router();

// Mount API routes
apiRouter.use('/v1/auth', authRoutes);
apiRouter.use('/v1/users', userRoutes);
apiRouter.use('/v1/farms', farmRoutes);
apiRouter.use('/v1/cycles', cycleRoutes);
apiRouter.use('/v1/tests', testRoutes);
apiRouter.use('/v1/notifications', notificationRoutes);
apiRouter.use('/v1/support/bug-reports', bugReportRoutes);
apiRouter.use('/v1/support/chat', supportChatRoutes);
apiRouter.use('/v1/ai/crop-suggestions', cropSuggestionRoutes);
apiRouter.use('/v1/profit-calculator', profitEntryRoutes);
apiRouter.use('/v1/sync', offlineSyncRoutes);
apiRouter.use('/v1/support/tutorials', videoTutorialRoutes);
apiRouter.use('/v1/locations', locationRoutes);
apiRouter.use('/v1/otp', otpRoutes);
apiRouter.use('/v1/admin', adminRoutes);

// Mount API router
app.use('/api', apiRouter);

// Serve static files in production
if (config.NODE_ENV === 'production') {
  // Set static folder
  const clientPath = join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));

  // Handle SPA
  app.get('*', (req, res) => {
    res.sendFile(join(clientPath, 'index.html'));
  });
}

// Handle 404 routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
