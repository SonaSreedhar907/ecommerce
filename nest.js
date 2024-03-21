import { Request, Response, NextFunction } from "express";
import User from "../user/user.model";
import { Order, OrderProducts } from "./placeorder.model";
import { NotificationService } from "../../utils/notification";

interface AuthenticatedRequest extends Request {
  user?: any;
}

const postPlaceOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id;
  try {
    const lastOrder = await Order.findOne({
      where: { userid: userId },
      order: [["orderDate", "DESC"]],
      limit: 1,
    });

    if (lastOrder?.status === "processing") {
      return res.status(400).json({
        error: "Cannot create another order. Current order is still processing",
      });
    }

    const userCartProducts = await CartProduct.findAll({
      where: { userid: userId },
      include: [{ model: Product, attributes: ["id", "title", "price"] }],
    });

    if (userCartProducts.length === 0) {
      return res.status(400).json({
        error: "Cart is empty. Add products before placing an order.",
      });
    }

    const totalAmount = userCartProducts.reduce(
      (total, cartProduct) =>
        total + cartProduct.quantity * parseFloat(cartProduct.Product.price),
      0
    );

    const newOrder = await Order.create(
      {
        userid: userId,
        orderDate: new Date(),
        totalAmount: totalAmount.toFixed(2),
        orderProducts: userCartProducts.map((cartProduct) => ({
          productId: cartProduct.product,
          price: parseFloat(cartProduct.Product.price),
          quantity: cartProduct.quantity,
        })),
      },
      { include: [{ model: OrderProducts, as: "orderProducts" }] }
    );

    await NotificationService.createNotification(
      `Your order with ID ${newOrder.id} has been placed successfully`,
      userId,
      "Order Placed"
    );

    await CartProduct.destroy({ where: { userid: userId } });

    const user = await User.findByPk(userId);
    const username = user?.username;
    const userEmail = user?.email;

    return res.status(200).json({
      message: "Order placed successfully",
      order: { ...newOrder.toJSON(), username, userEmail },
    });
  } catch (error) {
    console.log("Error:", error);
    next(error);
  }
};

const cancelOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.status === "Approved" || order.status === "delivered") {
      return res
        .status(400)
        .json({ error: "Cannot cancel an approved order" });
    }
    await order?.destroy();
    return res.status(200).json({ message: "Order Cancelled successfully" });
  } catch (error) {
    console.log("error is ", error);
    next(error);
  }
};

const editOrder = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const { action, productId } = req.body;

    const order = await Order.findByPk(orderId, {
      include: [{ model: OrderProducts, as: "orderProducts" }],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot modify an order that is not pending" });
    }

    switch (action) {
      case "add":
        // Logic for adding a product to the order
        break;
      case "remove":
        // Logic for removing a product from the order
        break;
      case "increment":
        // Logic for incrementing the quantity of a product in the order
        break;
      case "decrement":
        // Logic for decrementing the quantity of a product in the order
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
  } catch (error) {
    console.log("error is ", error);
    next(error);
  }
};

export { postPlaceOrder, cancelOrder, editOrder };




// const tasks = [
//   {
//     id: 1,
//     index: 0,
//     name: "task 1",
//     parentID: 0,
//   },
//   {
//     id: 3,
//     index: 2,
//     name: "task 3",
//     parentID: 2,
//   },
//   {
//     id: 2,
//     index: 1,
//     name: "task 2",
//     parentID: 1,
//   },
//   {
//     id: 5,
//     index: 4,
//     name: "task 5",
//     parentID: 4,
//   },
//   {
//     id: 4,
//     index: 3,
//     name: "task 4",
//     parentID: 0,
//   },
//   {
//     id: 6,
//     index: 5,
//     name: "task 6",
//     parentID: 4,
//   },
// ];
// function organizeTasks(tasks, parentId = 0) {
//   const nestedTasks = [];
//   tasks
//       .filter(task =>task.parentID === parentId)
//       .sort((a, b) => {
//         a.index - b.index
//       })
//       .forEach(task => {
//           const children = organizeTasks(tasks, task.id);
//           if (children.length > 0) {
//               task.child = children;
//           }
//           nestedTasks.push(task);
//       });
//   return nestedTasks;
// }
// console.log(JSON.stringify(organizeTasks(tasks)))








// // function compare(a, b) {
// //     const index1 = a.index;
// //     const index2 = b.index;
  
// //     let comparison = 0;
// //     if (index1 > index2) {
// //       comparison = 1;
// //     } else if (index1 < index2) {
// //       comparison = -1;
// //     }
// //     return comparison;
// //   }
// // const tasks=bv.sort(compare)




// // function buildHierarchy(b) {
// //   const a = [];
// //   b.forEach((task) => {
// //     if (task.parentID === 0) {
// //       a.push({ ...task, child: [] });
// //     } else {
// //       a.forEach((z) => {
// //         if (z.id === task.index) {
// //           z.child.push({ ...task, child: [] });
// //         }
// //       });
// //       a.forEach((f) => {
// //         f.child.forEach((n) => {
// //           if (n.id === task.index) {
// //             n.child.push({ ...task });
// //           }
// //         });
// //       });
// //     }
// //   });
// //   return a;
// // }
// // console.log(JSON.stringify(buildHierarchy(b)));







// // function recursion(b) {
// //   const a = [];
// //   const addToValues = (node, b) => {
// //     b.forEach(task => {
// //       if (node.id == task.index) {
// //         const childNode = { ...task, child: [] };
// //         node.child.push(childNode);
// //       }
// //     });
// // };

// //   b.forEach(task => {
// //     if (task.parentID === 0) {
// //       const rootNode = { ...task, child: [] };
// //       addToValues(rootNode, b);
// //       a.push(rootNode);
// //     }
// //   });
// //   return a;
// // }

// // console.log(JSON.stringify(recursion(b)))






// // function recursion(b) {
// //   const a = [];

// //   const addToValues = (node, tasks) => {
// //     tasks.forEach(task => {
// //       if (node.id == task.index) {
// //         const childNode = { ...task, child: [] };
// //         node.child.push(childNode);
// //       }
// //     });
// //   };
// //   b.forEach(task => {
// //     if (task.parentID === 0) {
// //       const rootNode = { ...task, child: [] };
// //       addToValues(rootNode, b);
// //       a.push(rootNode);
// //     }
// //   });

// //   return a;
// // }
// // console.log(JSON.stringify(recursion(b)))


// // function recursion(b){
// //   const a=[]
// //   const addToValues=(node,b)=>{
// //     b.forEach((task)=>{
// //       if(node.id == task.index){
// //         const childNode = {...task,child:[]}
      
// //         node.child.push(childNode)
// //       }
// //     })
// //     addToValues(childNode,task)
// //   }
// //   b.forEach(task => {
// //     if(task.parentID == 0){
// //       const rootNode= {...task,child:[]}
// //       addToValues(rootNode,b)
// //       a.push(rootNode)
// //     }
// //   });
// // return a
// // }
// // console.log(JSON.stringify(recursion(b)))





