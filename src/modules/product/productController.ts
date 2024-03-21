import { Product, ProductImage } from "./product.model";
import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";

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
const getPosts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, category, brand, color, sort, page, limit } = req.query;
    let whereClause: any = {};

    // Parse page and limit to integers, default to 1 and 10 respectively
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const skip: number = (parsedPage - 1) * parsedLimit;

    // Get total count of posts
    const total = await Product.count();
    const totalPages = Math.ceil(total / parsedLimit);

    // Handle invalid page numbers
    if (parsedPage < 1 || skip >= total) {
      return res.status(400).json({ error: "Invalid page number" });
    }

    // Sorting 
    let order: [string, "ASC" | "DESC"][] = [];
    if (sort && typeof sort === "string") {
      const [sortField, sortOrder] = sort.split(":");
      if (
        sortField &&
        sortOrder &&
        (sortOrder === "asc" || sortOrder === "desc")
      ) {
        order = [[sortField, sortOrder.toUpperCase() as "ASC" | "DESC"]];
      }
    }

    // Set up whereClause based on query parameters
    if (title) whereClause.title = { [Op.substring]: title.toString() };
    if (category)
      whereClause.category = { [Op.substring]: category.toString() };
    if (brand) whereClause.brand = { [Op.substring]: brand.toString() };
    if (color) whereClause.color = { [Op.substring]: color.toString() };

    // Remove undefined or null values from whereClause
    whereClause = Object.fromEntries(
      Object.entries(whereClause).filter(([_, v]) => v != null)
    );

    // Fetch posts with pagination
    const allProducts = await Product.findAll({
      where: whereClause,
      order: order,
      offset: skip,
      limit: parsedLimit,
      include: [{ model: ProductImage, as: "images" }],
    });

    // Map posts and add dateOfPosting
    const productsWithDate = allProducts.map((product: any) => ({
      ...product.toJSON(),
      dateOfPosting: product.createdAt.toLocaleDateString(),
      images: product.images.map((image: any) => image.image),
    }));

    res.status(200).json({
      total,
      totalPages,
      page: parsedPage,
      limit: parsedLimit,
      products: productsWithDate,
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

export { create, getPosts, deletePost, updatePost };
