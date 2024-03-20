import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {postPlaceOrder,cancelOrder,editOrder} from './placeorderController'

const router = express.Router();

router.use(verifyToken);

router.post("/place-order",postPlaceOrder);

router.delete("/cancelorder/:id",cancelOrder)

router.post("/editOrder/:id",editOrder)

export default router;