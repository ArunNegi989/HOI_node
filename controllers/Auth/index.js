// backend/controllers/auth/index.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../../models/User");

const JWT_KEY = process.env.JWT_KEY || "dev_secret_key";

// POST /v1/auth/register
exports.createUsers = async (req, res) => {
  try {
    const { name, email, phone, address, password, role, profileimage } = req.body;

    // basic validations
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // check if email already exists
    const existing = await Users.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await Users.create({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      role: role || "user",             // default user
      profileimage: profileimage || "", // optional for now
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profileimage: user.profileimage,
      },
    });
  } catch (err) {
    console.error("createUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// OPTIONAL: login controller to match your SignIn page
// POST /v1/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_KEY,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
