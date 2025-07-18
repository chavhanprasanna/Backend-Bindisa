import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    throw new ApiError(400, 'Validation failed', {
      errors: errorMessages,
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

/**
 * Middleware factory for validating request data
 * @param {Array} validations - Array of validation chains
 * @returns {Array} Array of middleware functions
 */
export const validate = (validations) => {
  return [
    ...validations,
    validateRequest
  ];
};

export default {
  validate,
  validateRequest
};
