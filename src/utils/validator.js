import { isEmail, isURL, isIP, isUUID, isISO8601, isISO31661Alpha2 } from 'validator';
import { ApiError } from './apiError.js';
import logger from './logger.js';

class Validator {
  /**
   * Validate and sanitize input data against a schema
   * @param {Object} data - Input data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Sanitized data
   * @throws {ApiError} If validation fails
   */
  static validate(data, schema) {
    let rules;
    const errors = {};
    const sanitizedData = {};

    // Check if data is an object
    if (typeof data !== 'object' || data === null) {
      throw new ApiError(400, 'Input data must be an object');
    }

    // Validate each field in the schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = [];

      // Check if field is required
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push('Field is required');
        continue;
      }

      // Skip further validation if field is not required and empty
      if ((value === undefined || value === null || value === '') && !rules.required) {
        if (rules.default !== undefined) {
          sanitizedData[field] = rules.default;
        }
        continue;
      }

      // Type validation
      if (rules.type) {
        const typeCheck = this.checkType(value, rules.type);
        if (typeCheck !== true) {
          fieldErrors.push(typeCheck);
          continue;
        }
      }

      // Custom validation
      if (rules.validate && typeof rules.validate === 'function') {
        try {
          const validationResult = rules.validate(value, data);
          if (validationResult !== true) {
            fieldErrors.push(validationResult);
            continue;
          }
        } catch (error) {
          logger.error(`Validation error for field ${field}:`, error);
          fieldErrors.push('Validation failed');
          continue;
        }
      }

      // Sanitization
      let sanitizedValue = this.sanitize(value, rules);

      // Additional validation based on type
      if (rules.type === 'string') {
        // String length validation
        if (rules.minLength && sanitizedValue.length < rules.minLength) {
          fieldErrors.push(`Must be at least ${rules.minLength} characters`);
        }

        if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
          fieldErrors.push(`Must be at most ${rules.maxLength} characters`);
        }

        // Pattern matching
        if (rules.pattern && !new RegExp(rules.pattern).test(sanitizedValue)) {
          fieldErrors.push(rules.patternMessage || 'Invalid format');
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(sanitizedValue)) {
          fieldErrors.push(`Must be one of: ${rules.enum.join(', ')}`);
        }

        // Email validation
        if (rules.isEmail && !isEmail(sanitizedValue)) {
          fieldErrors.push('Invalid email address');
        }

        // URL validation
        if (rules.isURL && !isURL(sanitizedValue, rules.urlOptions)) {
          fieldErrors.push('Invalid URL');
        }

        // IP validation
        if (rules.isIP && !isIP(sanitizedValue, rules.ipVersion)) {
          fieldErrors.push(`Invalid IP address (${rules.ipVersion || 'v4 or v6'})`);
        }

        // UUID validation
        if (rules.isUUID && !isUUID(sanitizedValue, rules.uuidVersion)) {
          fieldErrors.push('Invalid UUID');
        }

        // Trim whitespace
        if (rules.trim !== false) {
          sanitizedValue = sanitizedValue.trim();
        }

        // Convert case
        if (rules.lowercase) {
          sanitizedValue = sanitizedValue.toLowerCase();
        } else if (rules.uppercase) {
          sanitizedValue = sanitizedValue.toUpperCase();
        }
      }

      // Number validation
      else if (rules.type === 'number') {
        // Convert to number if it's a string
        if (typeof sanitizedValue === 'string') {
          sanitizedValue = parseFloat(sanitizedValue);
        }

        // Range validation
        if (rules.min !== undefined && sanitizedValue < rules.min) {
          fieldErrors.push(`Must be at least ${rules.min}`);
        }

        if (rules.max !== undefined && sanitizedValue > rules.max) {
          fieldErrors.push(`Must be at most ${rules.max}`);
        }

        // Integer validation
        if (rules.integer && !Number.isInteger(sanitizedValue)) {
          fieldErrors.push('Must be an integer');
        }

        // Positive/negative validation
        if (rules.positive && sanitizedValue <= 0) {
          fieldErrors.push('Must be a positive number');
        }

        if (rules.negative && sanitizedValue >= 0) {
          fieldErrors.push('Must be a negative number');
        }
      }

      // Date validation
      else if (rules.type === 'date') {
        // Convert string to Date object
        if (typeof sanitizedValue === 'string') {
          // Check ISO 8601 format
          if (rules.iso8601 && !isISO8601(sanitizedValue)) {
            fieldErrors.push('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
          } else {
            sanitizedValue = new Date(sanitizedValue);
          }
        }

        // Check if it's a valid date
        if (isNaN(sanitizedValue.getTime())) {
          fieldErrors.push('Invalid date');
        }

        // Date range validation
        if (rules.minDate && sanitizedValue < new Date(rules.minDate)) {
          fieldErrors.push(`Date must be after ${new Date(rules.minDate).toISOString()}`);
        }

        if (rules.maxDate && sanitizedValue > new Date(rules.maxDate)) {
          fieldErrors.push(`Date must be before ${new Date(rules.maxDate).toISOString()}`);
        }
      }

      // Array validation
      else if (rules.type === 'array') {
        if (!Array.isArray(sanitizedValue)) {
          fieldErrors.push('Must be an array');
        } else {
          // Check array length
          if (rules.minItems && sanitizedValue.length < rules.minItems) {
            fieldErrors.push(`Must have at least ${rules.minItems} items`);
          }

          if (rules.maxItems && sanitizedValue.length > rules.maxItems) {
            fieldErrors.push(`Must have at most ${rules.maxItems} items`);
          }

          // Validate each item in the array
          if (rules.items) {
            const itemErrors = [];
            const sanitizedItems = [];

            for (let i = 0; i < sanitizedValue.length; i++) {
              try {
                const item = rules.items.type === 'object'
                  ? this.validate(sanitizedValue[i], rules.items.schema || {})
                  : this.sanitize(sanitizedValue[i], rules.items);

                sanitizedItems.push(item);
              } catch (error) {
                itemErrors.push(`Item ${i + 1}: ${error.message}`);
              }
            }

            if (itemErrors.length > 0) {
              fieldErrors.push(...itemErrors);
            } else {
              sanitizedValue = sanitizedItems;
            }
          }
        }
      }

      // Object validation
      else if (rules.type === 'object' && rules.schema) {
        try {
          sanitizedValue = this.validate(sanitizedValue, rules.schema);
        } catch (error) {
          fieldErrors.push(error.message);
        }
      }

      // Add to sanitized data if no errors
      if (fieldErrors.length === 0) {
        sanitizedData[field] = sanitizedValue;
      } else {
        errors[field] = fieldErrors;
      }
    }

    // Check for unknown fields
    if (rules.strict) {
      const allowedFields = new Set(Object.keys(schema));
      for (const field of Object.keys(data)) {
        if (!allowedFields.has(field)) {
          errors[field] = ['Unknown field'];
        }
      }
    }

    // Throw error if there are validation errors
    if (Object.keys(errors).length > 0) {
      throw ApiError.validationError('Validation failed', errors);
    }

    return sanitizedData;
  }

  /**
   * Check if a value matches the expected type
   * @private
   * @param {*} value - Value to check
   * @param {string} type - Expected type
   * @returns {boolean|string} True if valid, error message if invalid
   */
  static checkType(value, type) {
    const typeMap = {
      string: (v) => typeof v === 'string' || v instanceof String || v === null || v === undefined,
      number: (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(v) && !isNaN(parseFloat(v))),
      boolean: (v) => typeof v === 'boolean' || (typeof v === 'string' && ['true', 'false', '0', '1'].includes(v.toLowerCase())),
      object: (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
      array: (v) => Array.isArray(v),
      date: (v) => v instanceof Date || !isNaN(new Date(v).getTime()),
      any: () => true
    };

    const typeChecker = typeMap[type];
    if (!typeChecker) {
      return `Unsupported type: ${type}`;
    }

    return typeChecker(value) || `Must be of type ${type}`;
  }

  /**
   * Sanitize a value based on rules
   * @private
   * @param {*} value - Value to sanitize
   * @param {Object} rules - Validation rules
   * @returns {*} Sanitized value
   */
  static sanitize(value, rules) {
    if (value === undefined || value === null) {
      return value;
    }

    let sanitizedValue = value;

    // Type conversion
    if (rules.type) {
      switch (rules.type) {
      case 'string':
        sanitizedValue = String(value);
        break;
      case 'number':
        sanitizedValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        break;
      case 'boolean':
        if (typeof value === 'string') {
          sanitizedValue = ['true', '1', 'yes'].includes(value.toLowerCase());
        } else {
          sanitizedValue = Boolean(value);
        }
        break;
      case 'date':
        sanitizedValue = new Date(value);
        break;
      }
    }

    // Custom sanitizer function
    if (rules.sanitize && typeof rules.sanitize === 'function') {
      try {
        sanitizedValue = rules.sanitize(sanitizedValue);
      } catch (error) {
        logger.error('Sanitization error:', error);
      }
    }

    return sanitizedValue;
  }

  /**
   * Validate email address
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  static validateEmail(email) {
    return isEmail(email);
  }

  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @param {Object} [options] - Validation options
   * @returns {boolean} True if valid
   */
  static validateURL(url, options = {}) {
    return isURL(url, options);
  }

  /**
   * Validate IP address
   * @param {string} ip - IP address to validate
   * @param {number|string} [version] - IP version (4, 6, or undefined for both)
   * @returns {boolean} True if valid
   */
  static validateIP(ip, version) {
    return isIP(ip, version);
  }

  /**
   * Validate UUID
   * @param {string} uuid - UUID to validate
   * @param {number|string} [version] - UUID version (1-5)
   * @returns {boolean} True if valid
   */
  static validateUUID(uuid, version) {
    return isUUID(uuid, version);
  }

  /**
   * Validate ISO 8601 date string
   * @param {string} date - Date string to validate
   * @returns {boolean} True if valid
   */
  static validateISO8601(date) {
    return isISO8601(date);
  }

  /**
   * Validate ISO 3166-1 alpha-2 country code
   * @param {string} code - Country code to validate
   * @returns {boolean} True if valid
   */
  static validateCountryCode(code) {
    return isISO31661Alpha2(code);
  }
}

export default Validator;
