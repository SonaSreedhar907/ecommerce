import {Order,OrderStatus} from '../placeorder/placeorder.model'
import { AuthenticatedRequest } from "../../utils/verifyUser";
import { Request, Response, NextFunction } from "express";
import moment from 'moment';

const orderTracking=async(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
)=>{
  try {
    const userId = req.user?.id
    const orders:Order[]|[]|undefined = await Order.findAll({
      where:{userid:userId},
      include:[{model:OrderStatus,as:'statuses'}]
    })
    const statusDetails = orders.map(order => {
      return order.dataValues.statuses.map((status:any) => {
        return {
          status: status.status,
          place: status.place!==null?status.place:undefined,
          createdAt: moment(status.createdAt).format('DD-MM-YYYY HH:mm:ss')
        };
      });
    })
    statusDetails.forEach(details=>details.reverse())
    res.status(200).json({ statusDetails });
  } catch (error) {
    next(error)
  }
}

export { orderTracking };