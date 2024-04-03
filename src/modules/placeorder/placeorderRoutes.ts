import express from "express";
import { verifyToken } from "../../utils/verifyUser";
import { postPlaceOrder, cancelOrder, editOrder, returnStatus} from "./placeorderController";

const router = express.Router();

router.use(verifyToken);

router.route("/place-order").post(postPlaceOrder);

router.route("/cancelorder/:id").delete(cancelOrder);

router.route("/editOrder/:id").post(editOrder);

router.route("/returnstatus/:id").post(returnStatus)

export default router;
