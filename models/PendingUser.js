// models/PendingUser.js
const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String, required: true }, // plain, will hash when final user is created
    otp: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingUser", pendingUserSchema);
