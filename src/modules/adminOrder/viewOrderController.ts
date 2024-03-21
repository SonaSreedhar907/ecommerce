import { Request, Response, NextFunction } from "express";
import { Order, OrderProducts } from "../placeorder/placeorder.model";
import { Op, where } from "sequelize";
import User from "../user/user.model";
import { Product, ProductImage } from "../product/product.model";
import { sendMail } from "../../utils/sendMails";
const moment = require("moment");

interface AuthenticatedRequest extends Request {
  user?: any;
}

const formatDate = (date: Date): string => {
  return moment(date).format("MMMM Do YYYY, h:mm:ss a");
};

// all orders display
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

// approve order
const approvedOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderIdParam = req.params.id;

    const orderData: any = await Order.findByPk(orderIdParam, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email"],
        },
        {
          model: OrderProducts,
          as: "orderProducts",
          attributes: ["quantity", "price"],
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["title"],
            },
          ],
        },
      ],
    });

    console.log("orderData is", orderData);

    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if the email has already been sent for this order
    if (orderData.emailSent) {
      return res
        .status(400)
        .json({ error: "Email already sent for this order" });
    }

    const userEmail = orderData.user.email;
    const orderId = orderData.id;
    const totalAmount = orderData.totalAmount;
    const orderDate = orderData.orderDate;

    // deliveryDate
    const deliveryDate = moment(orderDate).add(3, "days").toDate();

    // Extract order product details
    const orderProducts = orderData.orderProducts.map((product: any) => ({
      quantity: product.quantity,
      price: product.price,
      productName: product.product.title,
      subtotal: product.quantity * product.price,
    }));
    const subject = "Order Approved";

    // Dynamically generate the HTML markup
    let html = `
      <h2>Your order with ID ${orderId} has been approved.</h2>
      <h3>Order Details:</h3>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
    `;

    orderProducts.forEach((product: any) => {
      html += `
        <tr>
          <td>${product.productName}</td>
          <td>${product.quantity}</td>
          <td>$${product.price}</td>
          <td>$${product.subtotal}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
      <div>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
        <p><strong>Estimated Delivery Date:</strong> ${moment(
          deliveryDate
        ).format("MMMM Do YYYY")}</p>
      </div>
    `;

    // Send the email with dynamically generated HTML content
    await sendMail(userEmail, subject, "", totalAmount, "", deliveryDate, html);

    // Update the order to mark the email as sent
    await orderData.update({ emailSent: true });

    return res.status(200).json(orderData);
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Error sending email" });
  }
};

// change the status 
const changeStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findOne({ where: { id: orderId } });
    if (!order) {
      return res.status(400).json({ message: "No order found" });
    }
    order.status = "Approved";
    await order.save();
    return res.status(200).json(order);
  } catch (error) {
    console.log("error is ", error);
    next(error);
  }
};

export { orders, approvedOrder, changeStatus };
