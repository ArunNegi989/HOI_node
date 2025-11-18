// backend/models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
    address: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      required: true,
      default: "user", // "admin" / "user" etc
    },
    // store image as URL or file path (NOT File type)
    profileimage: {
      type: String,
      default: "", // make it optional for now
    },
  },
  {
    timestamps: true,
  }
);

// ❗ If you want paginate, you must import it first:
// const paginate = require("mongoose-paginate-v2");
// UserSchema.plugin(paginate);

module.exports = mongoose.model("Users", UserSchema);
