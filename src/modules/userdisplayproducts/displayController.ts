// products display in user side
import Post from '../product/product.model'
import { Request, Response, NextFunction } from "express";


interface PublicRequest extends Request {}

const getAllProducts = async(
    req: PublicRequest,
    res: Response,
    next: NextFunction
)=>{
   try {
    const allProducts = await Post.findAll()
    // Map products and add dateOfPosting
    const productsWithDate = allProducts.map((product) => ({
        ...product.toJSON(),
        dateOfPosting: product.createdAt.toLocaleDateString(),
      }));
      res.status(200).json({
        products:productsWithDate
      })
   } catch (error) {
    console.log('Error in getAllProducts ',error)
    res.status(500).json({error : 'Internal server error'})
    next(error)
   }
}

export {getAllProducts}