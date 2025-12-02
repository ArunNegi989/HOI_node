// models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// -------- ADDRESS SUB-SCHEMA (for multiple saved addresses) --------
const userAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    pincode: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    landmark: { type: String },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
    // ✅ For user’s saved addresses, we keep a default flag
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true } // each address will have its own _id (important for editing/deleting)
);

// -------- MAIN USER SCHEMA --------
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔹 Old single-address field (keep it, but NOT required now)
    //    So existing users stay valid, and new logic can use "addresses[]"
    address: {
      type: String,
      trim: true,
    },

    // 🔹 NEW: Multiple saved addresses for checkout
    addresses: {
      type: [userAddressSchema],
      default: [],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    profileimage: {
      type: String,
      default: "",
    },

    // ⭐ REQUIRED FOR FORGOT PASSWORD SYSTEM
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", UserSchema);
