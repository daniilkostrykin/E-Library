import axios from "axios";
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Login = require("../models/Login");
const { body, validationResult } = require("express-validator"); // Валидация
require("dotenv").config();

const router = express.Router();

const validations = [
  body("login").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  // другие валидации...
];

router.post("/api/auth/register", validations, async (req, res) => {
  console.log(req.url);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { login, password, persons_id } = req.body; // переименовал email в login

  try {
    const existingUser = await Login.findOne({ where: { login } });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким логином  уже  существует",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await Login.create({
      email,
      persons_id,
      is_admin: false,
      password: hashedPassword,
      name, // If you're saving these here
      group,
    });

    res.json({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Ошибка при регистрации:", error); // логирование ошибки
    res.status(500).json({ success: false, message: "Server error" }); // общее сообщение
  }
});

router.post("/login", validations, async (req, res) => {
  // добавлена валидация
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await Login.findOne({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.login_id, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.error("Ошибка при login:", error);

    res.status(500).json({ success: false, message: "Server error" });
  }
});

//  Добавлен endpoint /user-info

router.get("/user-info", authenticateJWT, async (req, res) => {
  try {
    const user = await Login.findByPk(req.user.id, {
      attributes: ["login_id", "is_admin", "email", "name", "group"], // Include all necessary attributes
    }); // Include all required fields

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json({
      id: user.login_id,
      email: user.email,
      name: user.name, // Access name directly
      group: user.group, // Access group directly
      role: user.is_admin ? "admin" : "user",
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;

      next();
    });
  } else {
    res.sendStatus(401);
  }
}

module.exports = router;
