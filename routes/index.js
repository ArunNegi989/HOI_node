// routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");

// /v1/auth/...
router.use("/auth", authRoutes);

// /v1/users/...
router.use("/users", userRoutes);

module.exports = router;
