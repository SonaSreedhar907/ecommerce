import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

class Product extends Model {
  public id!: number;
  public  title!: string;
  public description!: string;
  public quantity!: number;
  public images!: string[];
  public category!: string;
  public brand!: string;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    images: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
      },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.NUMBER, // Assuming a decimal type for price
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "product",
    timestamps: true,
  }
);

export default Product;
