import { Request, Response, NextFunction } from "express";
import Notification from "./notification.model";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// notifications 
const notificationsView = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: "You can't see the notifications" });
    }
    const notificationsDisplay = await Notification.findAll({
      where: { userid: userId },
      order: [['checked', 'ASC']]
    });
    res.status(200).json(notificationsDisplay);
  } catch (error) {
    next(error);
  }
};

// toggle notification
const toggleNotificationsReadStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const notifications = await Notification.findAll({
      where: { userid: userId }
    });
    if (notifications.length === 0) {
      return res.status(400).json({ message: "No notifications found" });
    }
    await Notification.sequelize?.transaction(async (transaction) => {
      for (const notification of notifications) {
        notification.checked = notification.checked === 0 ? 1 : 0;
        await notification.save({ transaction });
      }
    });
    res.status(200).json({ message: "Notification read status toggled successfully" });
  } catch (error) {
    next(error);
  }
};

// update the single notification
const updateSingleNotification = async (userId: any, notificationId: any) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, userid: userId }
  });
  if (!notification) {
    throw new Error('Notification not found for the user');
  }
  await Notification.sequelize?.transaction(async (transaction) => {
    notification.checked = 1;
    await notification.save({ transaction });
  });
};

// mark all notifications as read
const markAllNotificationsAsRead = async (userId: any) => {
  await Notification.update(
    { checked: 1 },
    { where: { userid: userId, checked: 0 } }
  );
};


// handle the notifications 
const handleNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const notificationId = req.query.notificationId;
    if (notificationId) {
      await updateSingleNotification(userId, notificationId);
      res.status(200).json({ message: 'Notification marked as read' });
    } else {
      await markAllNotificationsAsRead(userId);
      res.status(200).json({ message: "All Notifications marked as read" });
    }
  } catch (error) {
    next(error);
  }
};

export {
  notificationsView,
  toggleNotificationsReadStatus,
  handleNotifications,
};
