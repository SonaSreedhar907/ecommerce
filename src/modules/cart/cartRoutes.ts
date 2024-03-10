// cartRoutes.ts
import express from 'express';
import { verifyToken,AuthenticatedRequest } from '../../utils/verifyUser';
import { addToCart,getCartProducts,deleteCartProduct,changeQuantity } from './cartController';

const router = express.Router();

router.get('/add-to-cart/:id',verifyToken,addToCart);

router.get('/carts',verifyToken,getCartProducts)

router.get('/delete-cart-product/:id',verifyToken,deleteCartProduct)

router.patch('/change-product-quantity/:id/:action', verifyToken, changeQuantity);

export default router;
