import express from "express";
import { orders, approvedOrder, changeStatus,notify,updateOrderStatus,returnOrders } from "./viewOrderController";
import { verifyToken } from "../../utils/verifyUser";

const router = express.Router();

router.use(verifyToken);

router.route("/orders/:startDate?/:endDate?").get(orders);

router.route("/approvedorder/:id").post(approvedOrder);

router.route("/status/:id").post(changeStatus);

router.route("/notify/:id").post(notify)

router.route("/statusupdate/:orderId/:status/:place?").post(updateOrderStatus)

router.route("/returnorders/").get(returnOrders)


export default router;
