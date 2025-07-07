import User from '../models/User.js';

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(req.user.sub, req.body, { new: true });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
