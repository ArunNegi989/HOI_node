// backend/routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes); // => /v1/users & /v1/users/userdata

module.exports = router;
