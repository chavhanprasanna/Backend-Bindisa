import SoilTest from '../models/SoilTest.js';
import AIRecommendation from '../models/AIRecommendation.js';
import Farm from '../models/Farm.js';

async function findUserFarm(farmId, userId) {
  return Farm.findOne({ _id: farmId, ownerId: userId });
}

async function _analyzeAndGenerateRecommendations(test) {
  const recs = [];

  if (test.phLevel < 6.0) {
    recs.push({
      farmId: test.farmId,
      triggeringTest: test._id,
      type: 'WARNING',
      title: 'pH Imbalance Detected',
      description: 'Low pH can lock nutrients. Consider applying agricultural lime to raise soil pH.',
      actionRequired: 'Apply lime and retest in 30 days.',
    });
  }

  if (test.npkAnalysis?.potassium < 50) {
    recs.push({
      farmId: test.farmId,
      triggeringTest: test._id,
      type: 'WARNING',
      title: 'Urgent: Low Potassium Levels',
      description: 'Potassium deficiency can reduce yield. Apply a potassium-rich fertilizer.',
      actionRequired: 'Broadcast muriate of potash as per soil test report.',
    });
  }

  // Generic improvement suggestion
  recs.push({
    farmId: test.farmId,
    triggeringTest: test._id,
    type: 'SOIL_FERTILITY',
    title: 'Improve Organic Matter',
    description: 'Incorporate compost or green manure to improve soil structure and microbial activity.',
    actionRequired: 'Add 5–10 tons/acre well-decomposed compost before next planting.',
  });

  if (!recs.length) return [];
  return AIRecommendation.insertMany(recs);
}

export async function submitSoilTest(req, res, next) {
  try {
    const { farmId } = req.params;
    const userId = req.user.sub;

    const farm = await findUserFarm(farmId, userId);
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const testData = { ...req.body, farmId };
    const newTest = await SoilTest.create(testData);

    const recommendations = await _analyzeAndGenerateRecommendations(newTest);

    res.status(201).json({ test: newTest, recommendations });
  } catch (err) {
    next(err);
  }
}

export async function getSoilTestsForFarm(req, res, next) {
  try {
    const { farmId } = req.params;
    const userId = req.user.sub;

    const farm = await findUserFarm(farmId, userId);
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const tests = await SoilTest.find({ farmId }).sort({ testDate: -1 });
    res.json(tests);
  } catch (err) {
    next(err);
  }
}

export async function getRecommendationsForFarm(req, res, next) {
  try {
    const { farmId } = req.params;
    const userId = req.user.sub;

    const farm = await findUserFarm(farmId, userId);
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const recs = await AIRecommendation.find({ farmId }).sort({ createdAt: -1 });
    res.json(recs);
  } catch (err) {
    next(err);
  }
}
