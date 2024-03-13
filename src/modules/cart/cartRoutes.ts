// cartRoutes.ts
import express from 'express';
import { verifyToken,AuthenticatedRequest } from '../../utils/verifyUser';
import { addToCart,getCartProducts,deleteCartProduct,changeQuantity} from './cartController';

const router = express.Router();

router.use(verifyToken);

router.get('/add-to-cart/:id',addToCart);

router.get('/carts',getCartProducts)

router.get('/delete-cart-product/:id',deleteCartProduct)

router.patch('/change-product-quantity/:id/:action',changeQuantity);

export default router;
