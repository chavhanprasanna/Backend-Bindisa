import { validationResult, checkSchema } from 'express-validator';
import { validationErrorResponse } from '../utils/apiResponse.js';

/**
 * Validation middleware using express-validator
 * @param {Object} schema - Validation schema
 * @returns {Array} Array of middleware functions
 */
export const validate = (schema) => {
  return [
    // Validate request against schema
    checkSchema(schema),

    // Process validation results
    (req, res, next) => {
      const errors = validationResult(req);

      if (errors.isEmpty()) {
        return next();
      }

      // Format errors
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
  ];
};

/**
 * Async validation handler
 * @param {Function} validator - Validation function
 * @returns {Function} Express middleware function
 */
export const validateAsync = (validator) => {
  return async(req, res, next) => {
    try {
      await validator(req, res, next);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const formattedErrors = error.details.reduce((acc, detail) => {
        const key = detail.path.join('.');
        acc[key] = [detail.message];
        return acc;
      }, {});

      return validationErrorResponse(res, formattedErrors);
    }

    next();
  };
};

/**
 * Validate request query parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
      const formattedErrors = error.details.reduce((acc, detail) => {
        const key = detail.path.join('.');
        acc[key] = [detail.message];
        return acc;
      }, {});

      return validationErrorResponse(res, formattedErrors);
    }

    next();
  };
};

/**
 * Validate request parameters
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, { abortEarly: false });

    if (error) {
      const formattedErrors = error.details.reduce((acc, detail) => {
        const key = detail.path.join('.');
        acc[key] = [detail.message];
        return acc;
      }, {});

      return validationErrorResponse(res, formattedErrors);
    }

    next();
  };
};
