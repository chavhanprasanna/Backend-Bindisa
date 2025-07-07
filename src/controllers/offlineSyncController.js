import OfflineSyncLog from '../models/OfflineSyncLog.js';

export async function createSyncLog(req, res, next) {
  try {
    const { status, dataSummary } = req.body;
    const log = await OfflineSyncLog.create({ userId: req.user.sub, status, dataSummary });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function listSyncLogs(req, res, next) {
  try {
    const logs = await OfflineSyncLog.find({ userId: req.user.sub }).sort({ syncTimestamp: -1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
