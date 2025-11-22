// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  createUsers,
  loginUser,
  getUserdata,
  sendOtpRegister,
  verifyOtpRegister,
  forgotPassword,
  resetPassword,
} = require("../controllers/Auth/index");

const auth = require("../middleware/auth");

// Normal register
router.post("/register", createUsers);

// Login
router.post("/login", loginUser);

// Get logged in user
router.get("/userdata", auth, getUserdata);

// OTP registration
router.post("/register/send-otp", sendOtpRegister);
router.post("/register/verify-otp", verifyOtpRegister);

// ⭐ Forgot password
router.post("/forgot-password", forgotPassword);

// ⭐ Reset password
router.post("/reset-password", resetPassword);

module.exports = router;
