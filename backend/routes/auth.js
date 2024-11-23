
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Login = require("../models/Login");
require("dotenv").config();

const router = express.Router();

router.post("/register", async (req, res) => {
    const { login, password, persons_id } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await Login.create({ login, persons_id, is_admin: false, password: hashedPassword });
        res.json({ success: true, message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
});

router.post("/login", async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await Login.findOne({ where: { login } });

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error });
    }
});

module.exports = router;
