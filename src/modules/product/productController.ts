import { Product, ProductImage } from "./product.model";
import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";

import redis from "../../dbredis";

interface AuthenticatedRequest extends Request {
  user?: any;
}
interface CustomFile {
  filename: string;
  originalname: string;
}

// product creation
const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not allowed to create a post" });
    }

    const requiredFields = [
      "title",
      "description",
      "category",
      "brand",
      "price",
      "quantity",
    ];
    if (!requiredFields.every((field) => req.body[field])) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const newPost = await Product.create({
      ...req.body,
      userId: req.user.id,
    });

    //cache product data in redis

    const productid = newPost.id;
    await redis.set(`product:${productid}`, JSON.stringify(newPost));

    const imagePromises = req.files.map((file) => {
      return ProductImage.create({
        productId: newPost.id,
        image: file.originalname,
      });
    });

    await Promise.all(imagePromises);

    const updatedPost = await Product.findByPk(newPost.id, {
      include: [{ model: ProductImage, as: "images" }],
    });

    res.status(201).json({ newPost: updatedPost });
  } catch (error) {
    console.error("Error during post creation:", error);
    next(error);
  }
};

// get all the product post

// const getPosts = async (
//   req: AuthenticatedRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { title, category, brand, color, sort, page, limit } = req.query;
//     let whereClause: any = {};

//     // Parse page and limit to integers, default to 1 and 10 respectively
//     const parsedPage = parseInt(page as string, 10) || 1;
//     const parsedLimit = parseInt(limit as string, 10) || 10;
//     const skip: number = (parsedPage - 1) * parsedLimit;

//     // Fetch keys matching the pattern "product:*" from Redis
//     const redisKeys = await redis.keys("product:*");

//     // Fetch values for each key
//     const redisValues = await Promise.all(
//       redisKeys.map((key: any) => redis.get(key))
//     );

//     // Parse values if needed
//     const products = redisValues.map((value: any) => JSON.parse(value));

//     // Implement sorting logic if needed
//     // Implement filtering logic if needed

//     // Pagination logic
//     const total = products.length;
//     const totalPages = Math.ceil(total / parsedLimit);
//     const paginatedProducts = products.slice(skip, skip + parsedLimit);

//     // Map products and add dateOfPosting and ensure images property exists
//     const productsWithDate = paginatedProducts.map((product: any) => ({
//       ...product,
//       dateOfPosting: product.createdAt
//         ? new Date(product.createdAt).toLocaleDateString()
//         : null,
//       images: product.images
//         ? product.images.map((image: any) => image.image)
//         : [],
//     }));

//     res.status(200).json({
//       total,
//       totalPages,
//       page: parsedPage,
//       limit: parsedLimit,
//       products: productsWithDate,
//     });
//   } catch (error) {
//     console.error("Error in getPosts:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//     next(error);
//   }
// };


const getPosts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, sort, page, limit } = req.query;
    let searchItems: string | null = null;
    if (title) {
      searchItems = title as string;
    }

    // Parse page and limit to integers, default to 1 and 10 respectively
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const skip: number = (parsedPage - 1) * parsedLimit;

    // Fetch keys matching the pattern "product:*" from Redis
    const redisKeys = await redis.keys("product:*");

    // Fetch values for each key
    const redisValues = await Promise.all(
      redisKeys.map((key: any) => redis.get(key))
    );

    // Parse values if needed
    const products = redisValues.map((value: any) => JSON.parse(value));

    // Filter products based on search term using regex
    let filteredProducts = [...products];

    if (searchItems) {
      const regex = new RegExp(searchItems, "i");
      filteredProducts = products.filter((product: any) =>
        regex.test(product.title)
      );
    }

    // If no products found return a custom message
    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({ message: 'No products found for the given title' });
    }

    // Pagination logic
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / parsedLimit);

    // Ensure page is within bounds
    const validPage = Math.max(1, Math.min(parsedPage, totalPages));

    // Calculate slice indices
    const startIdx = (validPage - 1) * parsedLimit;
    const endIdx = Math.min(startIdx + parsedLimit, total);

    // Slice products array
    const paginatedProducts = filteredProducts.slice(startIdx, endIdx);

    // Fetch product images from the database
    const productImages = await ProductImage.findAll();

    // Map products and add dateOfPosting and include one image from the product image database
    const productsWithDateAndImage = paginatedProducts.map((product: any) => {
      const productImage = productImages.find(
        (image: any) => image.productId === product.id
      );
      const image = productImage ? productImage.image : null;
      return {
        ...product,
        dateOfPosting: product.createdAt
          ? new Date(product.createdAt).toLocaleDateString()
          : null,
        image: image,
      };
    });

    res.status(200).json({
      total,
      totalPages,
      page: validPage,
      limit: parsedLimit,
      products: productsWithDateAndImage,
    });
  } catch (error) {
    console.error("Error in getPosts:", error);
    res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
};





// delete the product
const deletePost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete a post" });
    }
    const postId = req.params.id;
    const postToDelete = await Product.findByPk(postId);
    if (!postToDelete) {
      return res.status(404).json({ message: "Post not found" });
    }
    await Promise.all([
      ProductImage.destroy({ where: { productId: postId } }),
      postToDelete.destroy(),
    ]);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log("Error in deletePost ", error);
    next(error);
  }
};

// update the product
const updatePost = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update a post" });
    }

    const postId = req.params.id;
    const postToUpdate: any = await Product.findByPk(postId);

    if (!postToUpdate) {
      return res.status(404).json({ message: "Post not found" });
    }

    const fieldsToUpdate = [
      "title",
      "description",
      "quantity",
      "brand",
      "category",
      "price",
    ];
    fieldsToUpdate.forEach((field) => {
      if (req.body[field]) {
        postToUpdate[field] = req.body[field];
      }
    });

    await postToUpdate.save();

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      await ProductImage.destroy({ where: { productId: postId } });

      const newImagesPromises = req.files.map((file) => {
        return ProductImage.create({
          productId: postId,
          image: file.originalname,
        });
      });

      await Promise.all(newImagesPromises);
    }

    const updatedPost = await Product.findByPk(postId, {
      include: [{ model: ProductImage, as: "images" }],
    });

    res.status(200).json({ message: "Post updated successfully", updatedPost });
  } catch (error) {
    console.error("Error in updatePost:", error);
    res.status(500).json({ error: "Internal Server Error" });
    next(error);
  }
};


export { create, getPosts, deletePost, updatePost};
