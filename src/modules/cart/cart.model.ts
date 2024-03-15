import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';
import {Product,ProductImage} from '../product/product.model'


class Cart extends Model{
    public id!: number;
    public userid!: number;
}

class CartProduct extends Model{
    public id!: number;
    public product!: number;
    public quantity!: number;
}

Cart.init(
    {
        userid:{
            type: DataTypes.INTEGER,
            allowNull: false
        },
    },{
        sequelize,
        modelName: 'Cart',
        tableName: 'cart',
        timestamps: false,
    }
)

CartProduct.init(
    {
      product:{
        type:DataTypes.INTEGER,
        allowNull: false
      },
      quantity:{
        type: DataTypes.INTEGER,
        allowNull:false,
        defaultValue: 1,
      },
    },{
       sequelize,
       tableName:'cartProduct',
       timestamps: false,
    }
)

Cart.hasMany(CartProduct,{foreignKey:'userid'})
CartProduct.belongsTo(Cart,{foreignKey:'userid'})
CartProduct.belongsTo(Product,{foreignKey:'product'})

export {Cart,CartProduct}