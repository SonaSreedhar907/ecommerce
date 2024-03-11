import Product from "./product.model";
import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: "you are not allowed to create a post" });
  }
  if (!req.body.title || !req.body.description) {
    return res
      .status(400)
      .json({ message: "please provide all required fields" });
  }
  const newPost = new Product({
    ...req.body,
    userId: req.user.id,
  });
  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error during post creation:", error);
    next(error);
  }
};


// get all the posts
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
        return res.status(400).json({ error: 'Invalid page number' });
      }
  
      // Sorting logic
      let order: [string, 'ASC' | 'DESC'][] = [];
      if (sort && typeof sort === 'string') {
        const [sortField, sortOrder] = sort.split(':');
        if (sortField && sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
          order = [[sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC']];
        }
      }
  
      // Set up whereClause based on query parameters
      if (title) whereClause.title = { [Op.substring]: title.toString() };
      if (category) whereClause.category = { [Op.substring]: category.toString() };
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
      });
  
      // Map posts and add dateOfPosting
      const productsWithDate = allProducts.map((product) => ({
        ...product.toJSON(),
        dateOfPosting: product.createdAt.toLocaleDateString(),
      }));
  
      res.status(200).json({
        total,
        totalPages,
        page: parsedPage,
        limit: parsedLimit,
        products: productsWithDate,
      });
    } catch (error) {
      console.error('Error in getPosts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      next(error);
    }
  };



  export { create, getPosts };