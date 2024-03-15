import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import { notificationsView,notificationclick } from './notificationController';

const router = express.Router();

router.use(verifyToken);

router.get('/notifications', notificationsView);

router.post('/clicknotifications',notificationclick)

export default router;