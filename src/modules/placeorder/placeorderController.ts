import { Request, Response, NextFunction } from "express";
import { Product, ProductImage } from "../product/product.model";
import { Cart, CartProduct } from "../cart/cart.model";
import User from "../user/user.model";
import { Order, OrderProducts } from "./placeorder.model";
import { NotificationService } from "../../utils/notification";

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

      // create a notification for the user
      const notificationContent = `Your order with ID ${newOrder.id} has been placed successfully`;
      const notificationLabel = "Order Placed";
      await NotificationService.createNotification(
        notificationContent,
        userId,
        notificationLabel
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

const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.status === "Approved" || order.status === "delivered") {
      return res.status(400).json({ error: "Cannot cancel an approved order" });
    } else if (order.status === "pending") {
      await order?.destroy();
      return res.status(400).json({ message: "Order Cancelled successfully" });
    }
  } catch (error) {
    console.log("error is ", error);
    next(error);
  }
};

const editOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const { action, productId } = req.body;

    const order: any = await Order.findByPk(orderId, {
      include: [{ model: OrderProducts, as: "orderProducts" }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot modify an order that is not pending" });
    }

    switch (action) {
 
    // add product
      case "add":
        const productToAdd = await Product.findByPk(productId);
        if (!productToAdd) {
          return res.status(404).json({ error: "Product not found" });
        }
        // Check if the product already exists in the order
        const existingOrderProduct = order.orderProducts?.find(
          (op: any) => op.productId === productId
        );
        if (existingOrderProduct) {
          existingOrderProduct.quantity += 1;
          await existingOrderProduct.save();
        } else {
          const price = parseFloat(productToAdd.price.toString()); // Convert to string before parsing
          const newOrderProduct = await OrderProducts.create({
            orderId: order.id,
            productId: productToAdd.id,
            quantity: 1,
            price: price,
          });
          // Add the newly created order product to the order
          if (order.orderProducts) {
            order.orderProducts.push(newOrderProduct);
          }
        }

        // Recalculate total amount for the order
        if (order.orderProducts) {
          order.totalAmount = order.orderProducts.reduce(
            (total: number, orderProduct: any) =>
              total + orderProduct.price * orderProduct.quantity,
            0
          );
        }

        // Save the changes to the order
        await order.save();

        return res.status(200).json({
          message: "Product added to the order successfully",
          order: order,
        });

        // remove product

      case "remove":
        const existingProduct = order.orderProducts?.find(
          (op: any) => op.productId === productId
        );
        if (!existingProduct) {
          return res
            .status(404)
            .json({ message: "Product not found in the order" });
        }
        await existingProduct.destroy();
        // Reload the order to fetch the updated order products
        await order.reload({
          include: [{ model: OrderProducts, as: "orderProducts" }],
        });
        order.totalAmount = order.orderProducts?.reduce(
          (total: number, orderProduct: any) =>
            total + orderProduct.price * orderProduct.quantity,
          0
        );
        await order.save();
        return res
          .status(400)
          .json({
            message: "Product removed from the order successfullt",
            order: order,
          });


          // increment quantity
      case "increment":
        const existingProductIncrement = order.orderProducts?.find(
          (op: any) => op.productId === productId
        );
        if (!existingProductIncrement) {
          return res
            .status(404)
            .json({ message: "Product not found in the order" });
        }
        existingProductIncrement.quantity += 1;
        await existingProductIncrement.save();
        order.totalAmount = order.orderProducts?.reduce(
          (total: number, orderProduct: any) =>
            total + orderProduct.price * orderProduct.quantity,
          0
        );
        await order.save();
        return res
          .status(200)
          .json({
            message: "product quantity incremented successfully",
            order: order,
          });


      // decrement quantity
      case "decrement":
        try {
          const existingProductDecrement = order.orderProducts?.find(
            (op: any) => op.productId === productId
          );
          if (!existingProductDecrement) {
            return res
              .status(404)
              .json({ message: "Product not found in the order" });
          }

          if (existingProductDecrement.quantity > 1) {
            existingProductDecrement.quantity -= 1;
            await existingProductDecrement.save(); // Save the updated quantity to the database
          } else {
            await existingProductDecrement.destroy();
          }

          // Calculate the total amount
          order.totalAmount = order.orderProducts?.reduce(
            (total: number, orderProduct: any) => {
              return total + orderProduct.price * orderProduct.quantity;
            },
            0
          );

          // Save the updated order with the new total amount
          await order.save();

          return res
            .status(200)
            .json({
              message: "Product quantity decremented successfully",
              order: order,
            });
        } catch (error) {
          console.error("Error updating quantity:", error);
          return res.status(500).json({ message: "Error updating quantity" });
        }

      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.log("error is ", error);
    next(error);
  }
};


export { postPlaceOrder, cancelOrder, editOrder };
