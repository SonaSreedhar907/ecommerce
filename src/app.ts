import express, { Request, Response, NextFunction } from "express";
import io from "socket.io-client";
import authRoutes from "./modules/user/authRoutes";
import productRoutes from "./modules/product/productRoutes";
import displayRoutes from "./modules/userdisplayproducts/displayRoutes";
import cartRoutes from "./modules/cart/cartRoutes";
import placeOrderRoutes from "./modules/placeorder/placeorderRoutes";
import adminOderViewRoutes from "./modules/adminOrder/viewOrderRouter";
import notificationRoutes from "./modules/notifications/notificationRoutes";
import dotenv from "dotenv";
import session from "express-session";
import { Sequelize } from "sequelize";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 7000;
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "sonakey",
    resave: false,
    saveUninitialized: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/display", displayRoutes);
app.use("/api/order", placeOrderRoutes);
app.use("/api/orderview", adminOderViewRoutes);
app.use("/api/notification", notificationRoutes);



//setting up server connection
const server = app.listen(PORT, () => {
  console.log(`Ecommerce Server is running on http://localhost:${PORT}`);
});


export const socket = io("http://localhost:4000");


socket.on("connect", () => {
  console.log("Connected to Server 1");
  // socket.emit("message", "Hello from client");
});

export function sendSocket(params:any) {
  socket.emit('orderapproved',params)
}


// Sequelize connection configuration
const sequelize = new Sequelize({
  dialect: "mysql",
  host: "localhost",
  username: "root",
  password: "root",
  database: "typescript",
});

// Test the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.log("Err", err);
  });


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});
