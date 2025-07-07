import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  submitSoilTest,
  getSoilTestsForFarm,
  getRecommendationsForFarm,
} from '../controllers/soilTestController.js';

const router = Router();

router.post('/:farmId', auth('FARMER', 'AGENT'), submitSoilTest);
router.get('/farm/:farmId', auth(), getSoilTestsForFarm);
router.get('/recommendations/:farmId', auth(), getRecommendationsForFarm);

export default router;
