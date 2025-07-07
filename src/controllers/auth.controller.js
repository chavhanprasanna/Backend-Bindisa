import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOtpMock, verifyOtpMock } from '../utils/otp.js';

function generateTokens(user) {
  const payload = { sub: user._id, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
  return { accessToken, refreshToken };
}

export async function requestOtp(req, res, next) {
  try {
    const { phoneNumber } = req.body;
    const code = await sendOtpMock(phoneNumber);
    return res.json({ success: true, message: 'OTP sent', otp: code });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { phoneNumber, otp, fullName } = req.body;
    let { role } = req.body; // Make role mutable

    // Sanitize the role input to match the schema enum
    if (role) {
      role = role.toUpperCase();
    }

    const valid = await verifyOtpMock(phoneNumber, otp);
    if (!valid) return res.status(400).json({ message: 'Invalid OTP' });

    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Brand new user. Create them with the sanitized role.
      user = await User.create({ phoneNumber, fullName, role });
    } else if (!user.fullName && fullName) {
      // User exists but is not fully registered. Update them now.
      user.fullName = fullName;
      user.role = role; // Use the sanitized role
      await user.save();
    }

    // Check if registration is complete.
    const needRegistration = !user.fullName;
    const tokens = generateTokens(user);
    return res.status(200).json({ ...tokens, needRegistration, user });

  } catch (err) {
    next(err);
  }
}

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
