import CropCycle from '../models/CropCycle.js';
import Farm from '../models/Farm.js';

// Helper to ensure farm belongs to user
async function findUserFarm(farmId, userId) {
  const farm = await Farm.findOne({ _id: farmId, ownerId: userId });
  return farm;
}

export async function createCropCycle(req, res, next) {
  try {
    const { farmId, cropName, plantingDate, expectedHarvestDate } = req.body;
    const userId = req.user.sub;

    const farm = await findUserFarm(farmId, userId);
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const cycle = await CropCycle.create({
      farmId,
      cropName,
      plantingDate,
      expectedHarvestDate,
    });

    farm.cropCycles.push(cycle._id);
    await farm.save();

    res.status(201).json(cycle);
  } catch (err) {
    next(err);
  }
}

export async function getCropCyclesForFarm(req, res, next) {
  try {
    const { farmId } = req.params;
    const userId = req.user.sub;

    const farm = await Farm.findOne({ _id: farmId, ownerId: userId }).populate('cropCycles');
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    res.json(farm.cropCycles);
  } catch (err) {
    next(err);
  }
}

export async function updateCropCycle(req, res, next) {
  try {
    const { cycleId } = req.params;
    const userId = req.user.sub;

    const cycle = await CropCycle.findById(cycleId);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    const farm = await findUserFarm(cycle.farmId, userId);
    if (!farm) return res.status(403).json({ message: 'Forbidden' });

    Object.assign(cycle, req.body);
    await cycle.save();

    res.json(cycle);
  } catch (err) {
    next(err);
  }
}

export async function deleteCropCycle(req, res, next) {
  try {
    const { cycleId } = req.params;
    const userId = req.user.sub;

    const cycle = await CropCycle.findById(cycleId);
    if (!cycle) return res.status(404).json({ message: 'Cycle not found' });

    const farm = await findUserFarm(cycle.farmId, userId);
    if (!farm) return res.status(403).json({ message: 'Forbidden' });

    await CropCycle.deleteOne({ _id: cycleId });
    await Farm.updateOne({ _id: farm._id }, { $pull: { cropCycles: cycleId } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
