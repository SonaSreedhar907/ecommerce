import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {postPlaceOrder} from './placeorderController'

const router = express.Router();


router.post("/place-order", verifyToken,postPlaceOrder);


export default router;