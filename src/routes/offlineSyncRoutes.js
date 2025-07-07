import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createSyncLog, listSyncLogs } from '../controllers/offlineSyncController.js';

const router = Router();

router.post('/', auth(), createSyncLog);
router.get('/', auth(), listSyncLogs);

export default router;
