import Notification from "../modules/notifications/notification.model";

class NotificationService {
  static async createNotification(content: any, userId: any, label: any) {
    try {
      const notification = await Notification.create({
        content,
        userid: userId,
        label,
      });
      return notification;
    } catch (error) {
      console.log("Error creating notification:", error);
      throw error;
    }
  }
}

export { NotificationService };
