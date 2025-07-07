import ProfitEntry from '../models/ProfitEntry.js';

export async function createEntry(req, res, next) {
  try {
    const { inputDetails, calculatedProfit } = req.body;
    if (typeof calculatedProfit !== 'number') return res.status(400).json({ message: 'calculatedProfit must be number' });
    const entry = await ProfitEntry.create({ userId: req.user.sub, inputDetails, calculatedProfit });
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
}

export async function listEntries(req, res, next) {
  try {
    const entries = await ProfitEntry.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
}
