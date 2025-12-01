// seed/ordersSeeder.js
const mongoose = require("mongoose");
const path = require("path");

// Load env
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

// Models
const Orders = require("../models/Order");
const Users = require("../models/User");
const Products = require("../models/Product");

// Helper: safe product image
function getProductImage(prod) {
  return (
    (Array.isArray(prod.images) && prod.images[0]) ||
    prod.image ||
    prod.mainImage ||
    "https://via.placeholder.com/400x600?text=HOI"
  );
}

// =======================================================================================
// ⭐ 1. Ensure second user (Prachi)
// =======================================================================================
async function ensureSecondUser() {
  const email = "pantprachi58@gmail.com";

  let user = await Users.findOne({ email });

  if (!user) {
    console.log("⚠️ Creating new user:", email);

    user = await Users.create({
      name: "Prachi Pant",
      email,
      phone: "9000000000",
      address: "Default Address",
      password: "Prachi@123",
      role: "user",
    });
  }

  return user;
}

// =======================================================================================
// ⭐ 2. Ensure THIRD user (Arun)
// =======================================================================================
async function ensureThirdUser() {
  const email = "arunnegi285@gmail.com";

  let user = await Users.findOne({ email });

  if (!user) {
    console.log("⚠️ Creating new dummy user:", email);

    user = await Users.create({
      name: "Arun Negi",
      email,
      phone: "8888888888",
      address: "HOI Main Office",
      password: "Arun@12345", // auto hashed
      role: "user",
    });
  }

  return user;
}

// =======================================================================================
// SEEDING SCRIPT
// =======================================================================================
async function seedDummyOrders() {
  try {
    const MONGO_URI = process.env.MONGODB_SRV;
    console.log("Connecting to Mongo...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected ✅");

    // 1️⃣ Minimum 3 products needed
    const productList = await Products.find().limit(3);
    if (productList.length < 3) {
      console.log("❌ Add at least 3 products first.");
      process.exit(1);
    }

    // 2️⃣ First default user
    const existingUser = await Users.findOne();
    if (!existingUser) {
      console.log("❌ No default user found.");
      process.exit(1);
    }

    // 3️⃣ Second user
    const secondUser = await ensureSecondUser();

    // 4️⃣ Third user
    const thirdUser = await ensureThirdUser();

    // ===================================================================================
    // ⭐ User 1 orders
    // ===================================================================================
    const ordersUser1 = [
      {
        user: existingUser._id,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "PLACED",
        items: [
          {
            product: productList[0]._id,
            name: productList[0].name,
            image: getProductImage(productList[0]),
            color: "Black",
            size: "M",
            mrp: 999,
            salePrice: 799,
            quantity: 1,
            lineTotal: 799,
            lineMrpTotal: 999,
          },
        ],
        shippingAddress: {
          name: existingUser.name,
          phone: existingUser.phone,
          addressLine1: "123 HOI Street",
          city: "Dehradun",
          state: "Uttarakhand",
          pincode: "248001",
        },
        itemsTotal: 799,
        mrpTotal: 999,
        discountTotal: 200,
        shippingFee: 0,
        grandTotal: 799,
        totalSavings: 200,
      },
    ];

    // ===================================================================================
    // ⭐ User 2: Prachi Orders
    // ===================================================================================
    const ordersUser2 = [
      {
        user: secondUser._id,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        status: "SHIPPED",
        items: [
          {
            product: productList[1]._id,
            name: productList[1].name,
            image: getProductImage(productList[1]),
            color: "Pink",
            size: "S",
            mrp: 1499,
            salePrice: 999,
            quantity: 1,
            lineTotal: 999,
            lineMrpTotal: 1499,
          },
        ],
        shippingAddress: {
          name: "Prachi Pant",
          phone: "9876543210",
          addressLine1: "Palm Street",
          city: "Delhi",
          state: "Delhi",
          pincode: "110001",
        },
        itemsTotal: 999,
        mrpTotal: 1499,
        discountTotal: 500,
        shippingFee: 40,
        grandTotal: 1039,
        totalSavings: 500,
      },
      {
        user: secondUser._id,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "DELIVERED",
        items: [
          {
            product: productList[2]._id,
            name: productList[2].name,
            image: getProductImage(productList[2]),
            color: "Red",
            size: "L",
            mrp: 1299,
            salePrice: 899,
            quantity: 2,
            lineTotal: 1798,
            lineMrpTotal: 2598,
          },
        ],
        shippingAddress: {
          name: "Prachi Pant",
          phone: "9000000000",
          addressLine1: "HOI Apartment",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
        itemsTotal: 1798,
        mrpTotal: 2598,
        discountTotal: 800,
        shippingFee: 0,
        grandTotal: 1798,
        totalSavings: 800,
      },
    ];

    // ===================================================================================
    // ⭐ User 3: ARUN Orders
    // ===================================================================================
    const ordersUser3 = [
      {
        user: thirdUser._id,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "OUT_FOR_DELIVERY",
        items: [
          {
            product: productList[0]._id,
            name: productList[0].name,
            image: getProductImage(productList[0]),
            color: "Navy",
            size: "L",
            mrp: 1199,
            salePrice: 899,
            quantity: 1,
            lineTotal: 899,
            lineMrpTotal: 1199,
          },
        ],
        shippingAddress: {
          name: "Arun Negi",
          phone: "8888888888",
          addressLine1: "HOI Corporate Tower",
          city: "Dehradun",
          state: "Uttarakhand",
          pincode: "248006",
        },
        itemsTotal: 899,
        mrpTotal: 1199,
        discountTotal: 300,
        shippingFee: 0,
        grandTotal: 899,
        totalSavings: 300,
      },

      {
        user: thirdUser._id,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        status: "PROCESSING",
        items: [
          {
            product: productList[1]._id,
            name: productList[1].name,
            image: getProductImage(productList[1]),
            color: "Green",
            size: "M",
            mrp: 1699,
            salePrice: 1299,
            quantity: 1,
            lineTotal: 1299,
            lineMrpTotal: 1699,
          },
        ],
        shippingAddress: {
          name: "Arun Negi",
          phone: "7000000000",
          addressLine1: "HOI Studio",
          city: "Delhi",
          state: "Delhi",
          pincode: "110002",
        },
        itemsTotal: 1299,
        mrpTotal: 1699,
        discountTotal: 400,
        shippingFee: 40,
        grandTotal: 1339,
        totalSavings: 400,
      },
    ];

    // Combine all orders
    const finalOrders = [...ordersUser1, ...ordersUser2, ...ordersUser3];

    // Clear previous orders
    await Orders.deleteMany({});
    console.log("Old orders cleared.");

    // Insert manually so orderNumber pre-save hook triggers
    for (const raw of finalOrders) {
      const orderDoc = new Orders(raw);
      await orderDoc.save();
      console.log(
        "Inserted order for:",
        raw.user.toString(),
        " → ",
        orderDoc.orderNumber
      );
    }

    console.log("🎉 All dummy orders inserted successfully!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seeder error:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seedDummyOrders();
