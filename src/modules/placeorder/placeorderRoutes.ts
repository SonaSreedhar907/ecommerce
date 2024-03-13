import express from 'express';
import {verifyToken}  from '../../utils/verifyUser';
import {postPlaceOrder} from './placeorderController'

const router = express.Router();

router.use(verifyToken);

router.post("/place-order",postPlaceOrder);


export default router;