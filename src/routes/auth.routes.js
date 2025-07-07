import { Router } from 'express';
import { requestOtp, verifyOtp, registerUser } from '../controllers/auth.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', auth(), registerUser);

export default router;
