import express from "express";
import { verifyToken, AuthenticatedRequest } from "../../utils/verifyUser";
import {
  addToCart,
  getCartProducts,
  deleteCartProduct,
  changeQuantity,
 
} from "./cartController";

const router = express.Router();

router.use(verifyToken);

router.route("/add-to-cart/:id").get(addToCart);

router.route("/carts").get(getCartProducts);

router.route("/delete-cart-product/:id").get(deleteCartProduct);

router.route("/change-product-quantity/:id/:action").patch(changeQuantity);



export default router;
