import express from "express";
import { verifyToken } from "../../utils/verifyUser";
import { orderTracking } from "./orderTracking";

const router = express.Router();

router.use(verifyToken);

router.route("/order-tracking").get(orderTracking);

export default router;
