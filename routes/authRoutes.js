// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  createUsers,
  loginUser,
  getUserdata,
  sendOtpRegister,
  verifyOtpRegister,
} = require("../controllers/Auth/index"); // 🟢 NOTE: folder name "Auth"

const auth = require("../middleware/auth");

// Normal register (non-OTP) – optional but keeping:
router.post("/register", createUsers);

// Login
router.post("/login", loginUser);

// Protected: get user data
router.get("/userdata", auth, getUserdata);

// OTP register routes
router.post("/register/send-otp", sendOtpRegister);
router.post("/register/verify-otp", verifyOtpRegister);

module.exports = router;
