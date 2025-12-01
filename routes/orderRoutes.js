// routes/orderRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  adminGetOrders,
  adminUpdateOrderStatus,
} = require("../controllers/order/orderController");

// USER ROUTES
router.post("/", auth, createOrder);
router.get("/my-orders", auth, getMyOrders);
router.get("/:id", auth, getOrderById);

// ADMIN ROUTES
router.get("/admin/list", auth, adminOnly, adminGetOrders);
router.patch("/admin/:id/status", auth, adminOnly, adminUpdateOrderStatus);

module.exports = router;
