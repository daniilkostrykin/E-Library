import axios from 'axios';

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Login = sequelize.define(
  "Login",
  {
    login_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    persons_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      // Use email
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Add unique constraint
    },
    password: {
      // Add password field
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    name: {
      // If you are saving the name in the logins table
      type: DataTypes.STRING,
      allowNull: false,
    },
    group: {
      // If you are saving the group in the logins table
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Logins",
    timestamps: false,
  }
);

module.exports = Login;
