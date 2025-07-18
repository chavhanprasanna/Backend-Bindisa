import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  createCropCycle,
  getCropCyclesForFarm,
  updateCropCycle,
  deleteCropCycle
} from '../controllers/cropCycleController.js';

const router = Router();

router.post('/', auth('FARMER', 'AGENT'), createCropCycle);
router.get('/farm/:farmId', auth(), getCropCyclesForFarm);
router.put('/:cycleId', auth('FARMER', 'AGENT'), updateCropCycle);
router.delete('/:cycleId', auth('FARMER', 'AGENT'), deleteCropCycle);

export default router;
