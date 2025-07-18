/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
export const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} code - Error code (default: 'ERROR')
 * @param {*} errors - Additional error details
 * @returns {Object} Formatted error response
 */
export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, code = 'ERROR', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(errors && { errors })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Pagination response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
export const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Validation error response formatter
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors
 * @param {string} message - Error message (default: 'Validation Error')
 * @returns {Object} Formatted validation error response
 */
export const validationErrorResponse = (res, errors, message = 'Validation Error') => {
  return res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      errors
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Not found response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Resource not found')
 * @returns {Object} Formatted not found response
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Unauthorized response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Unauthorized')
 * @returns {Object} Formatted unauthorized response
 */
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Forbidden response formatter
 * @param {Object} res - Express response object
 * @param {string} message - Error message (default: 'Forbidden')
 * @returns {Object} Formatted forbidden response
 */
export const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message
    },
    timestamp: new Date().toISOString()
  });
};
