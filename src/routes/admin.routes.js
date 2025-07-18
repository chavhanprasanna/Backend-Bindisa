import express from 'express';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/v1/admin/dashboard
router.get('/dashboard', auth('admin'), (req, res) => {
  return res.json({ success: true, message: 'Welcome to the admin dashboard', user: req.user });
});

export default router;
