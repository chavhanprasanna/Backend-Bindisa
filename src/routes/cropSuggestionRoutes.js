import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createSuggestion, listSuggestions } from '../controllers/cropSuggestionController.js';

const router = Router();

router.post('/', auth(), createSuggestion);
router.get('/', auth(), listSuggestions);

export default router;
