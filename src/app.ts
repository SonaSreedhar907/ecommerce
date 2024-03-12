import express, { Request, Response, NextFunction } from 'express';
import authRoutes from './modules/user/authRoutes';
import productRoutes from './modules/product/productRoutes'
import cartRoutes from './modules/cart/cartRoutes'
import displayRoutes from './modules/userdisplayproducts/displayRoutes'
import placeOrderRoutes from './modules/placeorder/placeorderRoutes'
import dotenv from 'dotenv';
import session from 'express-session';
import { Sequelize } from 'sequelize';
import cookieParser from 'cookie-parser'
import { Cart, CartProduct } from './modules/cart/cart.model'




const app = express();
const port = process.env.PORT || 3000;
dotenv.config();


// Sequelize connection configuration
const sequelize = new Sequelize({
    dialect: 'mysql', // e.g., 'mysql', 'postgres', 'sqlite'
    host: 'localhost',
    username: 'root',
    password: 'root',
    database: 'typescript',
});

// Test the database connection
sequelize
    .authenticate()
    .then(() => {
        console.log('Database connection has been established successfully.');
    })
    .catch((error) => {
        console.error('Unable to connect to the database:', error);
    });

    sequelize.sync({force: false}).then(()=>{
        console.log("Database synced successfully.");
    }).catch((err)=>{
        console.log("Err",err)
    })
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret:'sonakey',
    resave: false,
    saveUninitialized: true,
}))


// user routes
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/display',displayRoutes)
app.use('/api/order',placeOrderRoutes)


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
