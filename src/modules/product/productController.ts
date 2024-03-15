import {Product,ProductImage} from "./product.model";
import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";

interface AuthenticatedRequest extends Request {
  user?: any;
  
}
interface CustomFile {
  filename: string;
  originalname: string;
}

const create = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "you are not allowed to create a post" });
    }
    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ message: "please provide all required fields" });
    }

    // Check if req.files exists and is an array
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

     // Create product
     const newPost = await Product.create({
      ...req.body,
      userId: req.user.id,
    });
    const images=[]
    for(const file of req.files){
      const createdImage = await ProductImage.create({
        productId : newPost.id,
        image : file.originalname
      })
      images.push(createdImage)
    }
    //fetch the newly created post with associated images
    const updatedPost = await Product.findByPk(newPost.id, { include: [{ model: ProductImage, as: 'images' }] });
    res.status(201).json({newPost:updatedPost})
  } catch (error) {
    console.error("Error during post creation:", error);
    next(error);
  }
};







// get all the products
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
        include:[{model:ProductImage,as:'images'}]
      });
  
      // Map posts and add dateOfPosting
      const productsWithDate = allProducts.map((product:any) => ({
        ...product.toJSON(),
        dateOfPosting: product.createdAt.toLocaleDateString(),
        images: product.images.map((image: any) => image.image)
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




  const deletePost=async(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  )=>{
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "You are not allowed to delete a post" });
      }
      const postId = req.params.id
      const postToDelete = await Product.findByPk(postId)
      if(!postToDelete){
        return res.status(404).json({message:"Post not found"})
      }
      await postToDelete.destroy()
      res.status(200).json({message:"Post deleted successfully"})
    } catch (error) {
      console.log('Error in deletePost ',error)
      next(error)
    }
  }






  const updatePost = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Check if the user is an admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "You are not allowed to update a post" });
      }
  
      const postId = req.params.id;

      // Find the post to update by its ID
      const postToUpdate = await Product.findByPk(postId);
      console.log('post to update',postToUpdate)
      if (!postToUpdate) {
        return res.status(404).json({ message: "Post not found" });
      }
      console.log('after',postToUpdate.title)

      
      console.log('hiiii',req.body.title)
      // Update post fields if provided in the request body
      if (req.body.title) {
        postToUpdate.title = req.body.title;
      }
      if (req.body.description) {
        postToUpdate.description = req.body.description;
      }
      if (req.body.quantity) {
        postToUpdate.quantity = req.body.quantity;
      }
      if (req.body.brand) {
        postToUpdate.brand = req.body.brand;
      }
      if (req.body.category) {
        postToUpdate.category = req.body.category;
      }
  
      // Save the updated post
      await postToUpdate.save();
  
      // Check if new images are provided
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        // Destroy existing images associated with the post
        await ProductImage.destroy({ where: { productId: postId } });
  
        // Create and associate new images with the post
        const newImages = [];
        for (const file of req.files) {
          const createdImage = await ProductImage.create({
            productId: postId,
            image: file.originalname
          });
          newImages.push(createdImage);
        }
      }
  
      // Fetch the updated post with associated images
      const updatedPost = await Product.findByPk(postId, {
        include: [{ model: ProductImage, as: 'images' }]
      });
  
      // Return success response with updated post
      res.status(200).json({ message: "Post updated successfully", updatedPost });
    } catch (error) {
      console.error('Error in updatePost:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      next(error);
    }
  };
  



  export { create, getPosts,deletePost,updatePost};