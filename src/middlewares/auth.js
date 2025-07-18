import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Token blacklist to store invalidated tokens
const tokenBlacklist = new Set();

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 */
export const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
  // Optional: Set a timeout to remove the token from blacklist after it expires
  const decoded = jwt.decode(token);
  if (decoded?.exp) {
    const expiresIn = decoded.exp * 1000 - Date.now();
    if (expiresIn > 0) {
      setTimeout(() => tokenBlacklist.delete(token), expiresIn);
    }
  }
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} - True if token is blacklisted
 */
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

/**
 * Authentication middleware with role-based access control
 * @param {...string} allowedRoles - List of allowed roles (if empty, any authenticated user can access)
 * @returns {Function} Express middleware function
 */
export function auth(...allowedRoles) {
  return async(req, res, next) => {
    try {
      // Get token from Authorization header
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required: No token provided'
        });
      }

      const token = header.split(' ')[1];

      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          message: 'Session expired. Please log in again.'
        });
      }

      // Verify token
      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please log in again.'
          });
        }
        throw new Error('Invalid token');
      }

      // Check if user still exists and is active
      const user = await User.findById(payload.sub).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is no longer active'
        });
      }

      // Check if user role is allowed
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to access this resource'
        });
      }

      // Attach user to request object
      req.user = {
        id: user._id,
        role: user.role,
        ...(user.phoneNumber && { phoneNumber: user.phoneNumber })
      };

      // Set security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      next();
    } catch (err) {
      console.error('Authentication error:', err);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
      });
    }
  };
}

/**
 * Middleware to check if user has any of the specified roles
 * @param {...string} roles - List of allowed roles
 * @returns {Function} Express middleware function
 */
export const hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};
