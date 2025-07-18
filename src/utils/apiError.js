/**
 * Custom API error class
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Create a new API error
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {boolean} [isOperational=true] - Indicates if the error is operational
   * @param {string} [stack=''] - Error stack trace
   */
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Log the error stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error(this.stack);
    }
  }

  /**
   * Create a bad request error (400)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request') {
    return new ApiError(400, message);
  }

  /**
   * Create an unauthorized error (401)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  /**
   * Create a payment required error (402)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static paymentRequired(message = 'Payment Required') {
    return new ApiError(402, message);
  }

  /**
   * Create a forbidden error (403)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  /**
   * Create a not found error (404)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notFound(message = 'Not Found') {
    return new ApiError(404, message);
  }

  /**
   * Create a method not allowed error (405)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static methodNotAllowed(message = 'Method Not Allowed') {
    return new ApiError(405, message);
  }

  /**
   * Create a not acceptable error (406)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notAcceptable(message = 'Not Acceptable') {
    return new ApiError(406, message);
  }

  /**
   * Create a request timeout error (408)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static requestTimeout(message = 'Request Timeout') {
    return new ApiError(408, message);
  }

  /**
   * Create a conflict error (409)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }

  /**
   * Create a gone error (410)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static gone(message = 'Gone') {
    return new ApiError(410, message);
  }

  /**
   * Create a validation error (422)
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors
   * @returns {ApiError}
   */
  static validationError(message = 'Validation Error', errors = {}) {
    const error = new ApiError(422, message);
    error.errors = errors;
    return error;
  }

  /**
   * Create a too many requests error (429)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static tooManyRequests(message = 'Too Many Requests') {
    return new ApiError(429, message);
  }

  /**
   * Create an internal server error (500)
   * @param {string} message - Error message
   * @param {string} [stack] - Error stack trace
   * @returns {ApiError}
   */
  static internalServerError(message = 'Internal Server Error', stack) {
    return new ApiError(500, message, false, stack);
  }

  /**
   * Create a not implemented error (501)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static notImplemented(message = 'Not Implemented') {
    return new ApiError(501, message, false);
  }

  /**
   * Create a bad gateway error (502)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static badGateway(message = 'Bad Gateway') {
    return new ApiError(502, message, false);
  }

  /**
   * Create a service unavailable error (503)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static serviceUnavailable(message = 'Service Unavailable') {
    return new ApiError(503, message, false);
  }

  /**
   * Create a gateway timeout error (504)
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static gatewayTimeout(message = 'Gateway Timeout') {
    return new ApiError(504, message, false);
  }

  /**
   * Convert error to JSON
   * @returns {Object} JSON representation of the error
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

export { ApiError };
export default ApiError;
