import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import { notificationsView,toggleNotificationsReadStatus,handleNotifications} from './notificationController';

const router = express.Router();

router.use(verifyToken);

router.get('/notifications', notificationsView);

router.get('/togglenotificationsreadstatus/:id',toggleNotificationsReadStatus)

router.get('/handlenotification',handleNotifications)

export default router;