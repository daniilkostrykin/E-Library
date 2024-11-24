import axios from 'axios';
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5500;

const corsOptions = {
  origin: "http://127.0.0.1:5500", // замените на  URL  вашего frontend

  credentials: true, //access-control-allow-credentials:true

  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use("/api/auth", authRoutes);

sequelize
  .authenticate()
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("Unable to connect to the database:", err));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
