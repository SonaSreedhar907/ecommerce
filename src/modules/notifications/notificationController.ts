import { Request, Response, NextFunction } from "express";
import Notification from "./notification.model";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const notificationsView=async(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
)=>{
    try {
        const userId = req.user?.id
        if(!userId){
            return res.status(400).json({message:"You can't see the notifications"})
        }
        const notificationsDisplay = await Notification.findAll({
            where:{userid:userId},
            order:[['checked','ASC']]
        })

       return res.status(200).json(notificationsDisplay)        
    } catch (error) {
        console.log('error is ',error)
        next(error)
    }

}

const notificationclick = () =>{
   
}


export { notificationsView,notificationclick };