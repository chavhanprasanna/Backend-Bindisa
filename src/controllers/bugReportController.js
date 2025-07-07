import BugReport from '../models/BugReport.js';

export async function createBugReport(req, res, next) {
  try {
    const data = { ...req.body, userId: req.user.sub };
    const report = await BugReport.create(data);
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

export async function listBugReports(req, res, next) {
  try {
    const reports = await BugReport.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
}
