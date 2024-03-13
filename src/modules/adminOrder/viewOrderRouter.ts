import express from 'express';
import { orders } from './viewOrderController';
import { verifyToken } from '../../utils/verifyUser';

const router = express.Router();

router.use(verifyToken);

router.get('/orders/:startDate?/:endDate?',orders)

export default router;
