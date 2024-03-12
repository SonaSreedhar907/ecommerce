import { Request, Response, NextFunction } from "express";
import { Cart, CartProduct } from "./cart.model";
import { AuthenticatedRequest } from "../../utils/verifyUser";
import Product from "../product/product.model";

const addToCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id; // Use optional chaining to avoid runtime errors if `user` is undefined
  const proId = req.params.id;
  try {
    const userCart = await Cart.findOne({ where: { userid: userId } });
    if (!userCart) {
      const newCart = Cart.create({ userid: userId });
      await CartProduct.create({
        userid: userId,
        product: proId,
        quantity: 1,
      });
    } else {
      const proExist = await CartProduct.findOne({
        where: { userid: userId, product: proId },
      });
      if (proExist) {
        await proExist.increment("quantity", { by: 1 });
      } else {
        await CartProduct.create({
          userid: userId,
          product: proId,
          quantity: 1,
        });
      }
    }
    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.log("error is ", error);
    throw new Error("Error adding to cart");
  }
};

const getCartProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  try {
    // Find the user's cart
    const userCart = await Cart.findOne({ where: { userid: userId } });

    if (!userCart) {
      // If the cart doesn't exist, return an empty array
      return res.status(200).json({ products: [], totalPrice: 0 });
    }

    // Find all products in the user's cart
    const cartProducts = await CartProduct.findAll({
      where: { userid: userId },
      include: [
        {
          model: Product, // Include the Product model to get product details
          attributes: [
            "id",
            "title",
            "description",
            "price",
            "images",
            "brand",
          ], // Specify the attributes you want to retrieve
        },
      ],
    });

    // Calculate subtotal for each product and accumulate grand total
    let grandTotal = 0;
    const products = cartProducts.map((cartProduct) => {
      const productData = cartProduct as any;
      const subtotal =
        productData.quantity * parseFloat(productData.Product.price);
      grandTotal += subtotal;

      return {
        id: productData.id,
        quantity: productData.quantity,
        subtotal: subtotal.toFixed(2), // Format to two decimal places
        ...productData.Product.dataValues,
      };
    });

    res.status(200).json({ products, totalPrice: grandTotal.toFixed(2) });
  } catch (error) {
    console.log("Error is ", error);
    throw new Error("Error getting cart products");
  }
};

const deleteCartProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  const proId = req.params.id;
  console.log(userId, proId);
  try {
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const deletedProduct = await CartProduct.destroy({
      where: {
        product: proId,
        userid: userId,
      },
    });
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log("error is", error);
    next(error);
  }
};

const changeQuantity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const action = req.params.action;
    const userId = req.user?.id;
    console.log(productId);
    console.log(action);
    if (!userId || !productId || !action) {
      return res.status(400).json({ error: "Invalid request parameters." });
    }

    // Find the user's cart product
    const cartProduct = await CartProduct.findOne({
      where: { product: productId, userid: userId },
      include: [
        {
          model: Product,
          attributes: ["id", "title", "description", "price", "images"],
        },
      ],
    });

    if (!cartProduct) {
      return res.status(404).json({ error: "Product not found in the cart." });
    }

    // Update the quantity based on the action
    if (action === "increment") {
      cartProduct.quantity += 1;
    } else if (action === "decrement") {
      if (cartProduct.quantity > 1) {
        cartProduct.quantity -= 1;
      } else {
        // Remove the product if quantity is 1
        await cartProduct.destroy();
        return res
          .status(200)
          .json({ message: "Product removed from the cart." });
      }
    } else {
      return res.status(400).json({ error: "Invalid action." });
    }

    await cartProduct.save();

    // Respond with the updated cart product
    res
      .status(200)
      .json({ message: "Quantity updated successfully.", cartProduct });
  } catch (error) {
    console.error("Error updating cart product quantity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export { addToCart, getCartProducts, deleteCartProduct, changeQuantity };