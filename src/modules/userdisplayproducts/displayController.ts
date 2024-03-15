// products display in user side
import {Product,ProductImage} from '../product/product.model'
import { Request, Response, NextFunction } from "express";


interface PublicRequest extends Request {}

const getAllProducts = async(
    req: PublicRequest,
    res: Response,
    next: NextFunction
)=>{
   try {
    const allProducts = await Product.findAll({include:[{model:ProductImage,as:'images'}]})
    // Map products and add dateOfPosting

    const productsWithImages = allProducts.map((product) => ({
        ...product.toJSON(),
        dateOfPosting: product.createdAt.toLocaleDateString(),
        images: (product as any).images.map((image: any) => image.image), // Extract image paths
      }));
  
      res.status(200).json({
        products: productsWithImages,
      })
   } catch (error) {
    console.log('Error in getAllProducts ',error)
    res.status(500).json({error : 'Internal server error'})
    next(error)
   }
}

export {getAllProducts}