import { validationResult } from 'express-validator';
import { validationErrorResponse } from '../utils/apiResponse.js';

/**
 * Middleware to validate request data using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      const { param, msg } = error;
      if (!acc[param]) {
        acc[param] = [];
      }
      acc[param].push(msg);
      return acc;
    }, {});

    return validationErrorResponse(res, formattedErrors);
  }

  next();
};

export default validateRequest;
