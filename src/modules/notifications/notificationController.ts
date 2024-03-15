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

// const sendNotificationToSingleUser = async (
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         const Id = req.params.id
//         // Find the notification for the specified id
//         const notification = await Notification.findOne({
//             where: { id:Id }
//         });
//         if (!notification) {
//             return res.status(404).json({ message: 'Notification not found for the user' });
//         }
//         await Notification.sequelize?.transaction(async(transaction)=>{
//                 notification.checked = 1; 
//                 await notification.save({ transaction });         
//         })
//         return res.status(200).json({ message: 'Notification content updated successfully and marked as read' });
//     } catch (error) {
//         console.error('Error updating notification content:', error);
//         return next(error);
//     }
// };

// const markAllNotificationsAsRead = async(
//     req: AuthenticatedRequest,
//     res: Response,
//     next: NextFunction
// ) =>{
//    const userId = req.params.id
//    await Notification.update(
//         {checked:1},
//         {where:{userid:userId}}
//    )
//    return res.status(200).json('All notifications are marked as read successfully')
// }


const toggleNotificationsReadStatus = async(
  req: AuthenticatedRequest,
  res:Response,
  next:NextFunction
)=>{
   try{
      const userId = req.params.id
      const notifications = await Notification.findAll({
        where:{userid:userId}
      })
      if(notifications.length===0){
        return res.status(400).json({message:"no notifications found"})
      }
      await Notification.sequelize?.transaction(async(transaction)=>{
        for(const notification of notifications){
            notification.checked = notification.checked === 0 ? 1 : 0
            await notification.save({transaction})
        }
      })
      return res.status(200).json({message:"notification read status toggled successfully"})
   }catch(error){
     console.log(error)
     next(error)
   }
}


const updateSingleNotification =async(userId:any,notificationId:any)=>{
    const notification = await Notification.findOne(
        {where:{id:notificationId,userid:userId}}
    )
    if(!notification){
        throw new Error('Notification not found for the user');
    }
    await Notification.sequelize?.transaction(async(transaction)=>{
                 notification.checked = 1; 
                 await notification.save({ transaction });         
    })

}

const markAllNotificationsAsRead = async(userId:any)=>{
     await Notification.update(
        {checked:1},
        {where :{userid:userId}}
    )
}

const handleNotifications=async(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
)=>{
    try{
        const userId = req.user?.id
        const notificationId = req.query.notificationId
        if(notificationId){
         await updateSingleNotification(userId,notificationId)
         res.status(200).json({message:'Notification mark as read'})
        }else{
         await markAllNotificationsAsRead(userId)
         res.status(200).json({message:"All Notifications mark as read"})
        }
    }catch(error){
        next(error)
    }
}

export { notificationsView,toggleNotificationsReadStatus,handleNotifications};