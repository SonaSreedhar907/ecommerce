import express from "express";
import { verifyToken } from "../../utils/verifyUser";
import {
  notificationsView,
  toggleNotificationsReadStatus,
  handleNotifications,
} from "./notificationController";

const router = express.Router();

router.use(verifyToken);

router.route("/notifications").get(notificationsView);

router
  .route("/togglenotificationsreadstatus/:id")
  .get(toggleNotificationsReadStatus);

router.route("/handlenotification").get(handleNotifications);

export default router;
