// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { createUsers, loginUser } = require("../controllers/auth/index");

// register
router.post("/register", createUsers);

// login
router.post("/login", loginUser);

module.exports = router;
