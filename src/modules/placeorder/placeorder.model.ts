import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';
import {Product} from '../product/product.model'
import User from '../user/user.model';

class Order extends Model {
    public id!: number;
    public userid!: number;
    public orderDate!: Date;
    public totalAmount!: number;
    public status!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  }

  Order.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userid: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      orderDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      totalAmount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status:{
        type: DataTypes.STRING,
        defaultValue: 'pending'
      }
    },
    {
      tableName: "orders",
      sequelize,
    }
  );
  

class OrderProducts extends Model {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public price!: number;
  public quantity!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderProducts.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    tableName: "orderProducts",
    sequelize,
  }
);


Order.hasMany(OrderProducts,{foreignKey:'orderId',as:'orderProducts'})

OrderProducts.belongsTo(Order,{foreignKey:'orderId'})

Order.belongsTo(User,{foreignKey:'userid',as:'user'})

OrderProducts.belongsTo(Product,{foreignKey:'productId',as:'product'})

export {Order,OrderProducts};