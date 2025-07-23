import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { validateRequest } from '../src/middlewares/validateRequest.js';
import { validationResult } from 'express-validator';

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

// Mock validationErrorResponse
const mockValidationErrorResponse = jest.fn();
jest.unstable_mockModule('../src/utils/apiResponse.js', () => ({
  validationErrorResponse: mockValidationErrorResponse
}));

describe('Validation Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() when validation passes', () => {
    // Mock validation result with no errors
    validationResult.mockReturnValue({
      isEmpty: () => true
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockValidationErrorResponse).not.toHaveBeenCalled();
  });

  it('should return validation errors when validation fails', () => {
    // Mock validation result with errors
    const mockErrors = [
      { param: 'email', msg: 'Email is required' },
      { param: 'phone', msg: 'Phone number is invalid' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors
    });

    validateRequest(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mockValidationErrorResponse).toHaveBeenCalledWith(res, {
      email: ['Email is required'],
      phone: ['Phone number is invalid']
    });
  });

  it('should handle multiple errors for the same field', () => {
    const mockErrors = [
      { param: 'password', msg: 'Password is required' },
      { param: 'password', msg: 'Password must be at least 8 characters' }
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => mockErrors
    });

    validateRequest(req, res, next);

    expect(mockValidationErrorResponse).toHaveBeenCalledWith(res, {
      password: ['Password is required', 'Password must be at least 8 characters']
    });
  });
});
