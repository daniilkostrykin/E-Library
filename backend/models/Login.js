
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Login = sequelize.define("Login", {
  login_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  persons_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  login: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: "Logins",
  timestamps: false,
});

module.exports = Login;
