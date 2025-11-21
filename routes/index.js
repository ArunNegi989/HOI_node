// routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const productRoutes = require("./productRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);

module.exports = router;
