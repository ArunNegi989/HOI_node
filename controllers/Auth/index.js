// controllers/Auth/index.js
require("dotenv").config();

const Users = require("../../models/User");
const PendingUser = require("../../models/PendingUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// ✅ Email transporter (same for OTP + reset password)
console.log("MAIL USER from env:", process.env.ADMIN_EMAIL);
console.log("MAIL PASS exists?:", !!process.env.ADMIN_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  },
});

// =========================
//  REGISTER (simple)
// =========================
async function createUsers(req, res) {
  try {
    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Users.create({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (err) {
    console.error("createUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// =========================
//  LOGIN
// =========================
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = {
      userId: user._id,
      role: user.role || "user",
    };

    const token = jwt.sign(payload, process.env.JWT_KEY, {
      expiresIn: "7d",
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// =========================
//  GET USER DATA (protected)
// =========================
async function getUserdata(req, res) {
  try {
    const user = await Users.findById(req.userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User data fetched successfully",
      user,
    });
  } catch (err) {
    console.error("getUserdata error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// =========================
//  SEND OTP (REGISTER)
// =========================
async function sendOtpRegister(req, res) {
  try {
    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const pending = await PendingUser.findOneAndUpdate(
      { email },
      { name, email, phone, address, password, otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    console.log("✅ Pending user:", pending._id);
    console.log("✅ OTP for", email, "is:", otp);

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASS) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASS missing in .env");
      return res.status(500).json({
        message:
          "Email settings are not configured on server. Contact administrator.",
      });
    }

    try {
      await transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: email,
        subject: "Your HOI Signup OTP",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Welcome to House of Intimacy 👋</h2>
            <p>Your verification code is:</p>
            <p style="font-size: 20px; font-weight: bold; color: #e91e63;">
              ${otp}
            </p>
            <p>This code is valid for <b>15 minutes</b>. Do not share this OTP with anyone.</p>
            <hr />
            <p>If you did not request this, ignore this email.</p>
            <p>Regards,<br><b>Team HOI</b></p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("❌ Nodemailer error:", mailErr);
      return res.status(500).json({
        message:
          "Unable to send OTP email. Please check email settings on server.",
        error: mailErr.message,
      });
    }

    return res.json({
      success: true,
      message: "OTP sent to your email. Please verify.",
    });
  } catch (err) {
    console.error("❌ sendOtpRegister error:", err);
    return res.status(500).json({
      message: "Server error while sending OTP",
      error: err.message,
    });
  }
}

// =========================
//  VERIFY OTP (REGISTER)
// =========================
async function verifyOtpRegister(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const pending = await PendingUser.findOne({ email });

    if (!pending) {
      return res
        .status(400)
        .json({ message: "No pending registration found for this email" });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (pending.otpExpiresAt < new Date()) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: "OTP expired. Please try again." });
    }

    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pending.password, salt);

    const newUser = await Users.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      password: hashedPassword,
    });

    await PendingUser.deleteOne({ _id: pending._id });

    return res.json({
      success: true,
      message: "Email verified and account created successfully",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("verifyOtpRegister error:", err);
    return res.status(500).json({ message: "Server error while verifying OTP" });
  }
}

// =========================
//  FORGOT PASSWORD
// =========================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await Users.findOne({
      email: email.toLowerCase().trim(),
    });

    // Always generic response
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If this email exists in our system, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASS) {
      console.error("❌ ADMIN_EMAIL or ADMIN_PASS missing in .env");
      return res.status(500).json({
        message:
          "Email settings are not configured on server. Contact administrator.",
      });
    }

    try {
      await transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: user.email,
        subject: "Reset your HOI password",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Password Reset Request 🔐</h2>
            <p>Hi ${user.name || ""},</p>
            <p>We received a request to reset your password.</p>
            <p>Click the link below to set a new password (valid for <b>15 minutes</b>):</p>
            <p>
              <a href="${resetUrl}" target="_blank" style="color:#e91e63;">
                Reset your password
              </a>
            </p>
            <p>If you did not request this, ignore this email.</p>
            <hr />
            <p>Regards,<br><b>Team HOI</b></p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("❌ Forgot password mail error:", mailErr);
      return res.status(500).json({
        message:
          "Unable to send reset email. Please check email settings on server.",
        error: mailErr.message,
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "If this email exists in our system, a reset link has been sent.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({
      message: "Server error while processing forgot password.",
      error: err.message,
    });
  }
}

// =========================
//  RESET PASSWORD
// =========================
async function resetPassword(req, res) {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Token, password and confirmPassword are required",
      });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password do not match" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await Users.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({
      message: "Server error while resetting password.",
      error: err.message,
    });
  }
}

module.exports = {
  createUsers,
  loginUser,
  getUserdata,
  sendOtpRegister,
  verifyOtpRegister,
  forgotPassword,
  resetPassword,
};
