import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createBugReport, listBugReports } from '../controllers/bugReportController.js';

const router = Router();

router.post('/', auth(), createBugReport);
router.get('/', auth(), listBugReports);

export default router;
