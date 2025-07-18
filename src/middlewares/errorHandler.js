import logger from '../utils/logger.js';
import { ValidationError } from 'express-validation';
import celebratePkg from 'celebrate';
const { isCelebrate } = celebratePkg;
import { isBoom } from '@hapi/boom';

// Error response format
const errorResponse = (status, message, code, data = null) => ({
  success: false,
  error: {
    code,
    message,
    ...(data && { data })
  },
  timestamp: new Date().toISOString()
});

// List of error types to log as warnings
const WARNING_ERRORS = [
  'ValidationError',
  'UnauthorizedError',
  'ForbiddenError',
  'NotFoundError'
];

function errorHandler(err, req, res, next) {
  // Handle headers already sent
  if (res.headersSent) {
    logger.error('Headers already sent, error handling skipped');
    return next(err);
  }

  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let errors;
  let stack;

  // Handle different types of errors
  if (isCelebrate(err)) {
    // Joi validation error
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = [];

    for (const [segment, joiError] of err.details.entries()) {
      errors.push({
        segment,
        details: joiError.details.map(detail => ({
          message: detail.message,
          path: detail.path.join('.'),
          type: detail.type,
          context: detail.context
        }))
      });
    }
  } else if (err instanceof ValidationError) {
    // Express validation error
    status = err.statusCode;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    errors = Object.entries(err.details).reduce((acc, [field, errors]) => {
      acc[field] = errors.map(e => e.message);
      return acc;
    }, {});
  } else if (isBoom(err)) {
    // Boom error
    status = err.output.statusCode;
    message = err.message;
    code = err.data?.code || 'BOOM_ERROR';
    errors = err.data?.errors;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    status = 409;
    code = 'DUPLICATE_KEY';
    message = 'Duplicate key error';
    const key = Object.keys(err.keyPattern)[0];
    errors = { [key]: `${key} already exists` };
  }

  // Log the error
  const errorData = {
    status,
    code,
    message,
    path: req.originalUrl,
    method: req.method,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  if (status >= 500) {
    logger.error('Server Error:', errorData);
  } else if (WARNING_ERRORS.includes(err.name)) {
    logger.warn('Client Error:', errorData);
  } else {
    logger.info('Error:', errorData);
  }

  // Don't leak stack traces in production
  if (process.env.NODE_ENV === 'production') {
    delete errorData.stack;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
}

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { errorHandler, notFoundHandler, asyncHandler };
