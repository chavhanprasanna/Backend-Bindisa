import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { listNotifications, markAsRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', auth(), listNotifications);
router.post('/:notificationId/read', auth(), markAsRead);

export default router;
