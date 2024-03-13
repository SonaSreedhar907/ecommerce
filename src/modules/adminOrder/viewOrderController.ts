import { Request, Response, NextFunction } from "express";
import { Order, OrderProducts } from "../placeorder/placeorder.model";
import { Op, where } from "sequelize";
const moment = require("moment");
import User from "../user/user.model";
import Product from "../product/product.model";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const formatDate = (date: Date): string => {
  return moment(date).format("MMMM Do YYYY, h:mm:ss a");
};

const orders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.isAdmin) {
      const { startDate, endDate } = req.query;

      let whereCondition: any = {};

      if (startDate) {
        if (endDate) {
          whereCondition.orderDate = {
            [Op.and]: [
              {
                [Op.gte]: moment(startDate, "DD-MM-YYYY")
                  .startOf("day")
                  .toDate(),
              },
              { [Op.lte]: moment(endDate, "DD-MM-YYYY").endOf("day").toDate() },
            ],
          };
        } else {
          whereCondition.orderDate = {
            [Op.gte]: moment(startDate, "DD-MM-YYYY").startOf("day").toDate(),
          };
        }
      }

      const allOrders = await Order.findAll({
        where: whereCondition,
        order: [["orderDate", "ASC"]],
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["username", "email"],
          },
          {
            model: OrderProducts,
            as: "orderProducts",
            attributes: ["quantity"],
            include: [
              {
                model: Product,
                as: "product",
                attributes: [
                  "title",
                  "description",
                  "images",
                  "category",
                  "brand",
                  "price",
                ],
              },
            ],
          },
        ],
        
      });

      const formattedOrders = allOrders.map((order) => ({
        ...order.toJSON(),
        orderDate: formatDate(order.orderDate),
      }));

      res.status(200).json(formattedOrders);
    } else {
      res.status(403).json({ message: "You are not allowed to create a post" });
    }
  } catch (error) {
    console.error("Error:", error);
    next(error);
  }
};

export { orders };
