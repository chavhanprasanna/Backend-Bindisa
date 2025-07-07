import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { getMe, updateMe } from '../controllers/user.controller.js';

const router = Router();

router.get('/me', auth(), getMe);
router.put('/me', auth(), updateMe);

export default router;
