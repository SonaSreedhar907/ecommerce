import { Request, Response, NextFunction } from "express";
import { Order, OrderProducts, OrderStatus} from "../placeorder/placeorder.model";
import { Op } from "sequelize";
import User from "../user/user.model";
import { Product, ProductImage } from "../product/product.model";
import { sendMail } from "../../utils/sendMails";
import { sendSocket } from "../../socket";
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
      console.log(startDate)
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
    console.log('formatted orders is ',formattedOrders)
    res.status(200).json(formattedOrders);
    } else {
      res.status(403).json({ message: "You are not going to get all the orders" });
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

// Notify
const notify = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.isAdmin) {
      const orderId = req.params.id;

      let order = await Order.findByPk(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update the order status to "approved"
      order.status = "approved";
      await OrderStatus.create({
        orderId: order.id,
        status: 'approved'
      });
      await order.save();
     

      sendSocket({ data: `orderapproved${order.id}` });

      return res.status(200).json({ message: "Order approved successfully" });
    } else {
      return res
        .status(403)
        .json({ message: "You are not allowed to approve orders" });
    }
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};

const updateOrderStatus = async(req: AuthenticatedRequest, res: Response, next: NextFunction)=>{
  try {
    if(req.user.isAdmin){
      const orderId = req.params.orderId;
      const status = req.params.status;
      if(!orderId || !status){
        return res.status(400).json({message:"missing orderId or status"})
      }
      const validStatuses = ['pending','approved','shipped','out for delivery','delivered']
      if(!validStatuses.includes(status)){
        return res.status(400).json({message:"invalid status"})
      }
      let order = await Order.findByPk(orderId)
      if(!order){
        return res.status(400).json({message:"order not found"})
      }
      order.status = status
      let place = null
      if(['shipped','out for delivery','delivered'].includes(status)){
         place = req.params.place
         if(!place){
          return res.status(400).json({message:"missing place"})
         }
      }
      await order.save()
      await OrderStatus.create({
        orderId:orderId,
        status:status,
        place:place
      })
      return res.status(200).json(`order status updated to ${status}`)
    }else{
      return res.status(500).json({message:"internal server error"})
    }
  } catch (error) {
   next(error) 
  }
}





const returnOrders = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.isAdmin) {
      let startDate: any, endDate: any;
      if (req.query.startDate) {
        startDate = moment(req.query.startDate, 'D-M-YYYY');
      }
      if (req.query.endDate) {
        endDate = moment(req.query.endDate, 'D-M-YYYY').endOf('day'); 
      }
      
      const [deliveredOrders,returnedOrders]= await Promise.all([
              Order.sum('totalAmount',{
                where:{
                  status: "delivered"
                }
              }),
              Order.sum('totalAmount',{
                where:{
                  status:'return',
                  returnDate:{
                    [Op.between]:[startDate,endDate]
                  }
                }
              })
      ])
      
    
      const netSaleTotal = deliveredOrders - returnedOrders

      const orders = await Order.findAll({
        where:{
          status:'return',
          returnDate:{
            [Op.between]:[startDate,endDate]
          }
        },
        order:['returnDate']
      })
     
      let groupedOrders :{[key:string]:any[]}={}
      orders.forEach(order=>{
        const formattedReturnDate = moment(order.returnDate).format('D-M-YYYY')
        if(!groupedOrders[formattedReturnDate]){
          groupedOrders[formattedReturnDate]=[]
        }
        groupedOrders[formattedReturnDate].push({
          id:order.id,
          userid:order.userid,
          totalAmount:order.totalAmount,
          status:order.status,
          returnDate:formattedReturnDate
        })
      })
      return res.status(200).json({orders:Object.entries(groupedOrders),sum:deliveredOrders,netSaleTotal})
    } else {
      return res.status(400).json({ message: "return orders not found" });
    }
  } catch (error) {
    next(error);
  }
}



export { orders, approvedOrder, changeStatus, notify,updateOrderStatus,returnOrders};
