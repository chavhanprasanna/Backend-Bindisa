import axios from 'axios';
import https from 'https';
import http from 'http';
import { EventEmitter } from 'events';
import { ApiError } from './apiError.js';
import logger from './logger.js';
import config from '../config/env.js';

// Default HTTP agent with keepAlive for better performance
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000, // 1 minute
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000 // 60 seconds
});

// Default HTTPS agent with keepAlive for better performance
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000, // 1 minute
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000, // 60 seconds
  rejectUnauthorized: config.NODE_ENV === 'production' // Only verify SSL in production
});

/**
 * HTTP client with retry, circuit breaker, and request tracking
 */
class HttpClient extends EventEmitter {
  /**
   * Create a new HTTP client
   * @param {Object} options - Client options
   * @param {string} [options.baseURL] - Base URL for all requests
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Maximum number of retries for failed requests
   * @param {number} [options.retryDelay=1000] - Delay between retries in milliseconds
   * @param {boolean} [options.keepAlive=true] - Whether to use keep-alive connections
   * @param {Object} [options.headers] - Default headers for all requests
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {Object} [options.circuitBreaker] - Circuit breaker options
   * @param {number} [options.circuitBreaker.threshold=5] - Number of failures before opening the circuit
   * @param {number} [options.circuitBreaker.timeout=30000] - Time in milliseconds to wait before attempting to close the circuit
   */
  constructor(options = {}) {
    super();

    this.options = {
      baseURL: options.baseURL || '',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      keepAlive: options.keepAlive !== false,
      headers: {
        'User-Agent': `${config.APP_NAME || 'NodeJS'} HTTP Client`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      debug: options.debug || false,
      circuitBreaker: {
        threshold: 5, // Number of failures before opening the circuit
        timeout: 30000, // Time in milliseconds to wait before attempting to close the circuit
        ...(options.circuitBreaker || {})
      }
    };

    // Circuit breaker state
    this.circuitState = 'CLOSED'; // CLOSED, OPEN, or HALF-OPEN
    this.failureCount = 0;
    this.nextAttempt = 0;

    // Request metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalRetries: 0,
      circuitOpened: 0,
      circuitClosed: 0
    };

    // Create Axios instance with default config
    this.axios = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
      headers: this.options.headers,
      httpAgent: this.options.keepAlive ? httpAgent : undefined,
      httpsAgent: this.options.keepAlive ? httpsAgent : undefined,
      validateStatus: (status) => status >= 200 && status < 400 // Consider 2xx and 3xx as success
    });

    // Add request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        this.metrics.totalRequests++;
        this.emit('request', config);

        if (this.options.debug) {
          logger.debug(`HTTP Request: ${config.method?.toUpperCase()} ${config.url}`, {
            method: config.method,
            url: config.url,
            headers: config.headers,
            params: config.params,
            data: config.data
          });
        }

        return config;
      },
      (error) => {
        this.metrics.failedRequests++;
        this.emit('request-error', error);

        if (this.options.debug) {
          logger.error('HTTP Request Error:', error);
        }

        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        this.metrics.successfulRequests++;
        this.emit('response', response);

        if (this.options.debug) {
          logger.debug(`HTTP Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
          });
        }

        return response;
      },
      (error) => {
        this.metrics.failedRequests++;
        this.emit('response-error', error);

        if (this.options.debug) {
          logger.error('HTTP Response Error:', {
            message: error.message,
            code: error.code,
            config: error.config,
            response: error.response ? {
              status: error.response.status,
              statusText: error.response.statusText,
              headers: error.response.headers,
              data: error.response.data
            } : undefined
          });
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Make an HTTP request with retry and circuit breaker
   * @param {Object} config - Axios request config
   * @param {number} [retryCount=0] - Current retry count (internal use)
   * @returns {Promise<Object>} Response object
   */
  async request(config, retryCount = 0) {
    // Check circuit breaker
    if (this.circuitState === 'OPEN') {
      const now = Date.now();

      if (now < this.nextAttempt) {
        throw new ApiError(503, 'Service unavailable (circuit breaker open)');
      }

      // Try to close the circuit
      this.circuitState = 'HALF-OPEN';
      this.emit('circuit-half-open');

      if (this.options.debug) {
        logger.warn('Circuit breaker is HALF-OPEN, attempting a single request');
      }
    }

    try {
      const response = await this.axios({
        ...config,
        headers: {
          ...this.options.headers,
          ...(config.headers || {})
        }
      });

      // Reset circuit breaker on success
      if (this.circuitState !== 'CLOSED') {
        this.resetCircuit();
      }

      return response;
    } catch (error) {
      // Handle circuit breaker
      if (this.circuitState === 'HALF-OPEN') {
        this.openCircuit();
        throw error;
      }

      // Check if we should retry
      const isRetryable = this.isRetryableError(error) && retryCount < this.options.maxRetries;

      if (isRetryable) {
        this.metrics.totalRetries++;
        const delay = this.calculateRetryDelay(retryCount);

        if (this.options.debug) {
          logger.warn(`Retrying request (${retryCount + 1}/${this.options.maxRetries}) after ${delay}ms`);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry the request
        return this.request(config, retryCount + 1);
      }

      // Update failure count and check circuit breaker
      this.failureCount++;

      if (this.failureCount >= this.options.circuitBreaker.threshold && this.circuitState === 'CLOSED') {
        this.openCircuit();
      }

      // Format the error
      throw this.formatError(error);
    }
  }

  /**
   * Make a GET request
   * @param {string} url - Request URL
   * @param {Object} [config] - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async get(url, config = {}) {
    const response = await this.request({
      method: 'GET',
      url,
      ...config
    });

    return response.data;
  }

  /**
   * Make a POST request
   * @param {string} url - Request URL
   * @param {*} [data] - Request data
   * @param {Object} [config] - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, config = {}) {
    const response = await this.request({
      method: 'POST',
      url,
      data,
      ...config
    });

    return response.data;
  }

  /**
   * Make a PUT request
   * @param {string} url - Request URL
   * @param {*} [data] - Request data
   * @param {Object} [config] - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, config = {}) {
    const response = await this.request({
      method: 'PUT',
      url,
      data,
      ...config
    });

    return response.data;
  }

  /**
   * Make a PATCH request
   * @param {string} url - Request URL
   * @param {*} [data] - Request data
   * @param {Object} [config] - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async patch(url, data, config = {}) {
    const response = await this.request({
      method: 'PATCH',
      url,
      data,
      ...config
    });

    return response.data;
  }

  /**
   * Make a DELETE request
   * @param {string} url - Request URL
   * @param {Object} [config] - Axios request config
   * @returns {Promise<Object>} Response data
   */
  async delete(url, config = {}) {
    const response = await this.request({
      method: 'DELETE',
      url,
      ...config
    });

    return response.data;
  }

  /**
   * Check if an error is retryable
   * @private
   * @param {Error} error - Error object
   * @returns {boolean} True if the error is retryable
   */
  isRetryableError(error) {
    // Don't retry if the request was cancelled
    if (axios.isCancel(error)) {
      return false;
    }

    // Don't retry if the error doesn't have a response (network error)
    if (!error.response) {
      return true; // Network errors are usually transient
    }

    // Retry on server errors and 429 (Too Many Requests)
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  /**
   * Calculate delay between retries using exponential backoff with jitter
   * @private
   * @param {number} retryCount - Current retry count
   * @returns {number} Delay in milliseconds
   */
  calculateRetryDelay(retryCount) {
    const baseDelay = this.options.retryDelay;
    const maxJitter = baseDelay * 0.2; // 20% jitter
    const exponentialBackoff = Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Cap at 30 seconds
    const jitter = Math.random() * maxJitter * (Math.random() < 0.5 ? -1 : 1);

    return Math.max(0, exponentialBackoff + jitter);
  }

  /**
   * Format error response
   * @private
   * @param {Error} error - Error object
   * @returns {ApiError} Formatted error
   */
  formatError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data, statusText } = error.response;
      const message = data?.message || statusText || 'Request failed';

      return new ApiError(status, message, data);
    } else if (error.request) {
      // The request was made but no response was received
      return new ApiError(503, 'No response from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new ApiError(500, error.message || 'Request failed');
    }
  }

  /**
   * Open the circuit breaker
   * @private
   */
  openCircuit() {
    this.circuitState = 'OPEN';
    this.nextAttempt = Date.now() + this.options.circuitBreaker.timeout;
    this.metrics.circuitOpened++;
    this.emit('circuit-open');

    if (this.options.debug) {
      logger.warn(`Circuit breaker OPENED. Next attempt in ${this.options.circuitBreaker.timeout}ms`);
    }

    // Schedule an attempt to close the circuit
    setTimeout(() => {
      if (this.circuitState === 'OPEN') {
        this.circuitState = 'HALF-OPEN';
        this.emit('circuit-half-open');

        if (this.options.debug) {
          logger.warn('Circuit breaker is now HALF-OPEN');
        }
      }
    }, this.options.circuitBreaker.timeout);
  }

  /**
   * Reset the circuit breaker
   * @private
   */
  resetCircuit() {
    this.circuitState = 'CLOSED';
    this.failureCount = 0;
    this.nextAttempt = 0;
    this.metrics.circuitClosed++;
    this.emit('circuit-close');

    if (this.options.debug) {
      logger.info('Circuit breaker CLOSED');
    }
  }

  /**
   * Get current metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      circuitState: this.circuitState,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalRetries: 0,
      circuitOpened: 0,
      circuitClosed: 0
    };
  }
}

// Create and export a default instance
export const httpClient = new HttpClient({
  debug: config.NODE_ENV === 'development',
  baseURL: config.API_BASE_URL,
  timeout: parseInt(config.HTTP_TIMEOUT || '30000', 10),
  maxRetries: parseInt(config.HTTP_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(config.HTTP_RETRY_DELAY || '1000', 10),
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  },
  circuitBreaker: {
    threshold: parseInt(config.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    timeout: parseInt(config.CIRCUIT_BREAKER_TIMEOUT || '30000', 10)
  }
});

export default httpClient;
