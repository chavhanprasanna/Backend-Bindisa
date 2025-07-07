import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { createFarm, listFarms, getFarm, updateFarm } from '../controllers/farm.controller.js';

const router = Router();

router.post('/', auth('FARMER', 'AGENT'), createFarm);
router.get('/', auth(), listFarms);
router.get('/:id', auth(), getFarm);
router.put('/:id', auth('FARMER', 'AGENT'), updateFarm);

export default router;
