import { Request, Response, NextFunction } from "express";
import Product from "../product/product.model";
import { Cart, CartProduct } from "../cart/cart.model";
import User from "../user/user.model";
import { Order, OrderProducts } from "./placeorder.model";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const postPlaceOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  try {
    const lastOrder = await Order.findOne({
      where: { userid: userId },
      order: [["orderDate", "DESC"]],
      limit: 1,
    });

    if (!lastOrder || lastOrder.status === "delivered") {
      // Create a new order if there is no last order or the last order is delivered
      const userCartProducts = await CartProduct.findAll({
        where: { userid: userId },
        include: [
          {
            model: Product,
            attributes: ["id", "title", "price"],
          },
        ],
      });

      if (userCartProducts.length === 0) {
        return res.status(400).json({
          error: "Cart is empty. Add products before placing an order.",
        });
      }

      let totalAmount = 0;
      const orderProducts = userCartProducts.map((CartProduct) => {
        const productData = CartProduct as any;
        const productPrice = parseFloat(productData.Product.price);
        const subtotal = productData.quantity * productPrice;
        totalAmount += subtotal;
        return {
          productId: productData.product,
          price: productPrice,
          quantity: productData.quantity,
        };
      });

      const newOrder = await Order.create(
        {
          userid: userId,
          orderDate: new Date(),
          totalAmount: totalAmount.toFixed(2),
          orderProducts: orderProducts,
        },
        {
          include: [{ model: OrderProducts, as: "orderProducts" }],
        }
      );

      await CartProduct.destroy({ where: { userid: userId } });
      const user = await User.findByPk(userId);
      const username = user?.username;
      const userEmail = user?.email;

      return res.status(200).json({
        message: "Order placed successfully",
        order: {
          ...newOrder.toJSON(),
          username: username,
          userEmail: userEmail,
        },
      });
    } else if (lastOrder.status === "processing") {
      // Existing processing order, return an error
      return res.status(400).json({
        error: "Cannot create another order. Current order is still processing",
      });
    }
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};

export { postPlaceOrder };
