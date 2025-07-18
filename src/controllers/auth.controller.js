import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../config/firebase.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function generateTokens(user) {
  const payload = { sub: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
  return { accessToken, refreshToken };
}

// Rate limited OTP request endpoint
export const requestOtp = [
  authLimiter,
  asyncHandler(async(req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // In a production environment, you would call Firebase Auth's signInWithPhoneNumber here
    // For now, we'll simulate a successful OTP request
    return res.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, don't send the OTP back to the client
      // This is just for development/demo purposes
      ...(process.env.NODE_ENV !== 'production' ? { otp: '123456' } : {})
    });
  })
];

// Verify Firebase ID token and authenticate user
export const verifyOtp = [
  authLimiter,
  asyncHandler(async(req, res) => {
    const { idToken, phoneNumber, fullName } = req.body;
    let { role } = req.body;

    // Input validation
    if (!idToken || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'ID token and phone number are required'
      });
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);

      // Verify the phone number matches the token
      if (decodedToken.phone_number !== `+${phoneNumber}`) {
        return res.status(401).json({
          success: false,
          message: 'Phone number does not match token'
        });
      }

      // Sanitize role if provided
      if (role) {
        role = role.toUpperCase();
      }

      // Find or create user
      let user = await User.findOne({ phoneNumber });
      const isNewUser = !user;

      if (isNewUser) {
        // Create new user
        user = await User.create({
          phoneNumber,
          fullName,
          role: role || 'USER', // Default role
          firebaseUid: decodedToken.uid
        });
      } else if (!user.fullName && fullName) {
        // Update existing user's name if not set
        user.fullName = fullName;
        if (role) user.role = role;
        await user.save();
      }

      // Generate JWT tokens
      const tokens = generateTokens(user);

      // Set secure HTTP-only cookies
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return response
      return res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          role: user.role,
          isNewUser
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      });
    }
  })
];

export async function registerUser(req, res, next) {
  try {
    const userId = req.user.sub;
    const { fullName, role } = req.body;
    const user = await User.findByIdAndUpdate(userId, { fullName, role }, { new: true });
    return res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    next(err);
  }
}

// Get current user profile
export async function getCurrentUser(req, res, next) {
  try {
    // req.user.sub should contain the user ID from the JWT payload
    const userId = req.user && req.user.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await User.findById(userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// Logout controller
export async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// Refresh token controller
export async function refreshToken(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const accessToken = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' });
    res.status(200).json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}
