// controllers/Auth/index.js
const Users = require("../../models/User");
const PendingUser = require("../../models/PendingUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ✅ Email transporter for OTP (Gmail)

console.log("MAIL USER from env:", process.env.ADMIN_EMAIL);
console.log("MAIL PASS exists?:", !!process.env.ADMIN_PASS);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS,
  },
});

// ✅ Simple register (non-OTP, optional – keep if you still use it)
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
      // role, profileimage etc. agar tumhare schema mein hai to yaha add kar sakte ho
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

// ✅ Login user
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

// ✅ Get logged-in user data (protected)
async function getUserdata(req, res) {
  try {
    // req.userId is set by auth middleware
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

// ✅ SEND OTP – /v1/auth/register/send-otp
// ✅ SEND OTP – /v1/auth/register/send-otp
async function sendOtpRegister(req, res) {
  try {
    const { name, email, phone, address, password } = req.body;

    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // already registered?
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // save / update pending user
    const pending = await PendingUser.findOneAndUpdate(
      { email },
      { name, email, phone, address, password, otp, otpExpiresAt },
      { upsert: true, new: true }
    );

    console.log("✅ Pending user created/updated:", pending._id);
    console.log("✅ OTP for", email, "is:", otp);

    // 🟡 OPTIONAL: If you only want OTP in console (no email) while testing,
    // just return here:
    // return res.json({
    //   success: true,
    //   message: "OTP generated (check server console in dev).",
    // });

    // --- EMAIL SENDING PART (separate try/catch) ---
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
    text: `
Welcome to House of Intimacy!

Thank you for signing up.

Your verification code is: ${otp}
This code is valid for 15 minutes.

Do not share this OTP with anyone.

Regards,
Team HOI
    `,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to House of Intimacy 👋</h2>

        <p>Thank you for signing up! To complete your verification, please use the OTP code below:</p>

        <p style="font-size: 20px; font-weight: bold; color: #e91e63;">
          Your verification code is: <b>${otp}</b>
        </p>

        <p>This code is valid for <b>15 minutes</b>. Do not share this OTP with anyone for security reasons.</p>

        <hr />

        <p>If you did not request this code, please ignore this email or contact support immediately.</p>

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


// ✅ VERIFY OTP – /v1/auth/register/verify-otp
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

    // safety: already registered?
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: "Email already registered" });
    }

    // create real user with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pending.password, salt);

    const newUser = await Users.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      address: pending.address,
      password: hashedPassword,
      // role, profileimage etc. yaha add kar sakte ho
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

// ✅ IMPORTANT: Export as an object so destructuring works
module.exports = {
  createUsers,
  loginUser,
  getUserdata,
  sendOtpRegister,
  verifyOtpRegister,
};
