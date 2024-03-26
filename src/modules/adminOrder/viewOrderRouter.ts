import express from "express";
import { orders, approvedOrder, changeStatus,notify } from "./viewOrderController";
import { verifyToken } from "../../utils/verifyUser";

const router = express.Router();

router.use(verifyToken);

router.route("/orders/:startDate?/:endDate?").get(orders);

router.route("/approvedorder/:id").post(approvedOrder);

router.route("/status/:id").post(changeStatus);

router.route("/notify/:id").post(notify)


export default router;
