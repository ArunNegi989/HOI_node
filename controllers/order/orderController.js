// controllers/order/orderController.js
const Orders = require("../../models/Order");
const Products = require("../../models/Product");
const Users = require("../../models/Order"); // ✅ ensure this matches your actual file name

const {
  sendOrderEmailToCustomer,
  sendNewOrderEmailToOwner,
} = require("../../utils/sendOrderEmail");

// 🔹 helper: totals
const calculateTotals = (items) => {
  let mrpTotal = 0;
  let itemsTotal = 0;

  items.forEach((item) => {
    mrpTotal += item.lineMrpTotal;
    itemsTotal += item.lineTotal;
  });

  const discountTotal = mrpTotal - itemsTotal;
  const shippingFee = itemsTotal >= 999 ? 0 : 60; // example: 999+ free
  const grandTotal = itemsTotal + shippingFee;

  return { mrpTotal, itemsTotal, discountTotal, shippingFee, grandTotal };
};

// ✅ POST /v1/orders – user creates order (checkout se)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;

    const { items, shippingAddress, paymentMethod, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "No items in order" });
    }

    if (!shippingAddress || !shippingAddress.name) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    // 1) get product details from DB
    const productIds = items.map((i) => i.productId);
    const products = await Products.find({ _id: { $in: productIds } });

    const orderItems = items.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const mrp = product.price?.mrp || product.mrp;
      const salePrice = product.price?.sale || product.salePrice || mrp;
      const quantity = item.quantity || 1;

      return {
        product: product._id,
        name: product.name,
        image: product.images?.[0] || product.image,
        color: item.color,
        size: item.size,
        mrp,
        salePrice,
        quantity,
        lineTotal: salePrice * quantity,
        lineMrpTotal: mrp * quantity,
      };
    });

    const totals = calculateTotals(orderItems);

    // 2) order create
    const newOrder = await Orders.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: "PENDING", // ONLINE ke liye webhook se PAID karoge
      status: "PLACED",
      ...totals,
      totalSavings: totals.discountTotal,
      notes,
    });

    // 3) user details for email
    const user = await Users.findById(userId).select("name email");
    const orderForEmail = {
      ...newOrder.toObject(),
      user: user ? { name: user.name, email: user.email } : null,
    };

    // 🔔 Customer: "Order placed"
    await sendOrderEmailToCustomer(orderForEmail, "PLACED");

    // 🔔 Admin(s): "Order placed"
    await sendNewOrderEmailToOwner(orderForEmail, "PLACED");

    return res.status(201).json(newOrder);
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ message: "Failed to place order" });
  }
};

// ✅ GET /v1/orders/my-orders – current user history (My Orders page)
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Orders.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (err) {
    console.error("Get my orders error:", err);
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ✅ GET /v1/orders/:id – detail (user or admin)
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Orders.findById(orderId)
      .populate("user", "name email phone")
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    // user can only see own order; admin can see all
    if (
      req.userRole !== "admin" &&
      order.user &&
      order.user._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    return res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    return res.status(500).json({ message: "Failed to fetch order" });
  }
};

// ✅ ADMIN: GET /v1/orders/admin/list?status=&page=&limit=
exports.adminGetOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status && status !== "ALL") {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Orders.find(query)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Orders.countDocuments(query),
    ]);

    return res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      orders,
    });
  } catch (err) {
    console.error("Admin get orders error:", err);
    return res.status(500).json({ message: "Failed to fetch admin orders" });
  }
};

// ✅ ADMIN: PATCH /v1/orders/admin/:id/status
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, paymentStatus } = req.body;

    const validStatuses = [
      "PLACED",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];
    const validPaymentStatuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const order = await Orders.findById(orderId).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // update status & payment
    if (status) {
      order.status = status;

      // COD: delivered hone par paymentStatus = PAID
      if (order.paymentMethod === "COD" && status === "DELIVERED") {
        order.paymentStatus = "PAID";
      }
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // ✅ Email: user + admin dono ko jab STATUS change hua ho
    if (status) {
      const orderObj = order.toObject();

      // customer mail
      await sendOrderEmailToCustomer(orderObj, status);

      // admin mail (ALL ADMIN_EMAILS env me jitne bhi diye ho)
      await sendNewOrderEmailToOwner(orderObj, status);
    }

    return res.json(order);
  } catch (err) {
    console.error("Admin update status error:", err);
    return res.status(500).json({ message: "Failed to update order" });
  }
};
