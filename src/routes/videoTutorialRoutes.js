import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createTutorial, listTutorials } from '../controllers/videoTutorialController.js';

const router = Router();

router.get('/', auth(), listTutorials);
router.post('/', auth('ADMIN'), createTutorial);

export default router;
