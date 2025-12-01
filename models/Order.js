// models/Order.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    mrp: { type: Number, required: true },
    salePrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true }, // salePrice * quantity
    lineMrpTotal: { type: Number, required: true }, // mrp * quantity
  },
  { _id: false }
);

const addressSchema = new Schema(
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
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    items: [orderItemSchema],

    shippingAddress: addressSchema,

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
      index: true,
    },

    itemsTotal: { type: Number, required: true },
    mrpTotal: { type: Number, required: true },
    discountTotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    totalSavings: { type: Number, required: true },

    notes: { type: String },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },

    // 🔹 CANCELLATION FLOW FIELDS
    cancelRequested: {
      type: Boolean,
      default: false,
    },
    cancelReason: {
      type: String,
      default: null,
    },
    cancelReasonNote: {
      type: String,
      default: null,
    },
    cancelRequestedAt: {
      type: Date,
      default: null,
    },
    cancelApprovedAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId, // admin user id (optional)
      ref: "Users",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  if (!this.orderNumber) {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `HOI${y}${m}${d}${rand}`;
  }
  next();
});

module.exports = mongoose.model("Orders", orderSchema);
