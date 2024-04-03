import { Request, Response, NextFunction } from "express";
import { Cart, CartProduct } from "./cart.model";
import { AuthenticatedRequest } from "../../utils/verifyUser";
import { Product, ProductImage } from "../product/product.model";

//add to cart
const addToCart = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const proId = req.params.id;

    // Find or create user's cart and cart product concurrently
    const [userCart, [cartProduct]] = await Promise.all([
      Cart.findOrCreate({ where: { userid: userId } }),
      CartProduct.findOrCreate({
        where: { userid: userId, product: proId },
        defaults: { quantity: 0 },
      }),
    ]);

    if (cartProduct) {
      await cartProduct.increment("quantity", { by: 1 });
    }

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error in addToCart:", error);
    next(error);
  }
};

// get all the cart products
const getCartProducts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;

  try {
    const userCartPromise = Cart.findOne({ where: { userid: userId } });

    const cartProductsPromise = CartProduct.findAll({
      where: { userid: userId },
      include: [
        {
          model: Product,
          attributes: ["id", "title", "description", "price", "brand"],
          include: [
            {
              model: ProductImage,
              attributes: ["image"],
              as: "images",
              limit: 1,
            },
          ],
        },
      ],
    });

    const [userCart, cartProducts] = await Promise.all([
      userCartPromise,
      cartProductsPromise,
    ]);

    if (!userCart) {
      return res.status(200).json({ products: [], totalPrice: 0 });
    }

    let grandTotal = 0;
    const products = cartProducts.map((cartProduct) => {
      const productData = cartProduct.toJSON();
      const subtotal =
        productData.quantity * parseFloat(productData.Product.price);
      grandTotal += subtotal;

      return {
        id: productData.id,
        quantity: productData.quantity,
        subtotal: subtotal.toFixed(2),
        ...productData.Product,
        images: productData.Product.images,
      };
    });

    res.status(200).json({ products, totalPrice: grandTotal.toFixed(2) });
  } catch (error) {
    console.error("Error in getCartProducts:", error);
    next(error);
  }
};

// delete the cart product
const deleteCartProduct = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  const proId = req.params.id;
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
    console.log("Error in deleteCartProduct:", error);
    next(error);
  }
};

// change the quantity
const changeQuantity = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const productId = req.params.id;
    const action = req.params.action;
    const userId = req.user?.id;
    if (!userId || !productId || !action) {
      return res.status(400).json({ error: "Invalid request parameters." });
    }

    // Find the user's cart product
    const cartProduct = await CartProduct.findOne({
      where: { product: productId, userid: userId },
    });

    if (!cartProduct) {
      return res.status(404).json({ error: "Product not found in the cart." });
    }

    // Update the quantity based on the action
    if (action === "increment") {
      await cartProduct.increment("quantity", { by: 1 });
    } else if (action === "decrement") {
      if (cartProduct.quantity > 1) {
        await cartProduct.decrement("quantity", { by: 1 });
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

    // Respond with the updated cart product
    res
      .status(200)
      .json({ message: "Quantity updated successfully.", cartProduct });
  } catch (error) {
    console.error("Error updating cart product quantity:", error);
    next(error);
  }
};

export { addToCart, getCartProducts, deleteCartProduct, changeQuantity };