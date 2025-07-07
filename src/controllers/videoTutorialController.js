import VideoTutorial from '../models/VideoTutorial.js';

export async function createTutorial(req, res, next) {
  try {
    const tutorial = await VideoTutorial.create(req.body);
    res.status(201).json(tutorial);
  } catch (err) {
    next(err);
  }
}

export async function listTutorials(req, res, next) {
  try {
    const tutorials = await VideoTutorial.find().sort({ createdAt: -1 });
    res.json(tutorials);
  } catch (err) {
    next(err);
  }
}
