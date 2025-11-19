// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { createUsers, loginUser } = require("../controllers/Auth/index");

// POST /v1/auth/register
router.post("/register", createUsers);

// POST /v1/auth/login
router.post("/login", loginUser);

module.exports = router;
