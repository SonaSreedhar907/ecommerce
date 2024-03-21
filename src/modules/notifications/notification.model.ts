import { DataTypes, Model } from "sequelize";
import sequelize from "../db";
import User from "../user/user.model";

class Notification extends Model {
  public id!: number;
  public content!: string;
  public userid!: number;
  public label!: string;
  public checked!: number;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userid: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    checked: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: false,
  }
);

Notification.belongsTo(User, { foreignKey: "userid", as: "user" });

export default Notification;
