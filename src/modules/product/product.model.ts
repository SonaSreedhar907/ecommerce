import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

class Product extends Model {
  public id!: number;
  public title!: string;
  public description!: string;
  public quantity!: number;
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
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "product",
    timestamps: true,
  }
);


class ProductImage extends Model {
  public id!: number;
  public productId!: number;
  public image!: string; // Changed to a single string field for image path
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      
    },
  },
  {
    sequelize,
    tableName: "productimage",
    timestamps: true,
  }
);

Product.hasMany(ProductImage, { foreignKey: 'productId', as: 'images' })
ProductImage.belongsTo(Product, { foreignKey: 'productId', as: 'product' })

export {Product, ProductImage};


