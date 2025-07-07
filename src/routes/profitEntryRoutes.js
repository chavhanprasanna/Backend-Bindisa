import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createEntry, listEntries } from '../controllers/profitEntryController.js';

const router = Router();

router.post('/', auth(), createEntry);
router.get('/', auth(), listEntries);

export default router;
