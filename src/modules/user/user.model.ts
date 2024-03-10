import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class User extends Model {
    public id!: number;
    public username!: string;
    public email!: string;
    public password!: string;
    public isAdmin!: boolean;
}

User.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, 
      autoIncrement: true, 
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
  
}, {
    sequelize,
    tableName: 'user',
    timestamps: false,
});

export default User;
