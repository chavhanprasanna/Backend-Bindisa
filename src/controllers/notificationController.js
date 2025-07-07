import Notification from '../models/Notification.js';

export async function listNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ userId: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.sub },
      { isRead: true },
      { new: true },
    );
    if (!notification) return res.status(404).json({ message: 'Not found' });
    res.json(notification);
  } catch (err) {
    next(err);
  }
}
