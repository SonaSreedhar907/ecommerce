import express from 'express';
import { orders,approvedOrder } from './viewOrderController';
import { verifyToken } from '../../utils/verifyUser';

const router = express.Router();

router.use(verifyToken);

router.get('/orders/:startDate?/:endDate?',orders)

router.post('/approvedorder/:id',approvedOrder)

export default router;
