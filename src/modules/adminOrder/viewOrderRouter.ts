import express from 'express';
import { orders } from './viewOrderController';
import { verifyToken } from '../../utils/verifyUser';

const router = express.Router();

router.get('/orders/:startDate?/:endDate?',verifyToken,orders)

export default router;
