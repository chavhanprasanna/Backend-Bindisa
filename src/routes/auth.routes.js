import { Router } from 'express';
import {
  requestOtp,
  verifyOtp,
  registerUser,
  refreshToken,
  logout,
  getCurrentUser
} from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';
import { authLimiter, apiLimiter } from '../middlewares/rateLimiter.js';
import { securityMiddleware } from '../middlewares/security.js';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Public routes
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

// Protected routes (require authentication)
router.use(auth());

// Rate limited API routes
router.post('/register', [apiLimiter], registerUser);
router.post('/refresh-token', [apiLimiter], refreshToken);
router.post('/logout', [apiLimiter], logout);
router.get('/me', [apiLimiter], getCurrentUser);

export default router;
