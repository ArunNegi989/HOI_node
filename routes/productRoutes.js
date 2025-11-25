const express = require("express");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getProductsByBrand,   // 👈 ADD THIS
} = require("../controllers/products/index");

// ------------------- MULTER CONFIG -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/products"); // folder must exist
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// PUBLIC: list + filters
router.get("/", getProducts);

// ✅ PUBLIC: get products by brand
router.get("/brand/:brand", getProductsByBrand);

// PUBLIC: get product via slug (for product detail page)
router.get("/slug/:slug", getProductBySlug);

// PUBLIC: get product via id
router.get("/:id", getProductById);

// ADMIN: create product (with image upload)
router.post(
  "/",
  auth,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  createProduct
);

// ADMIN: update product (optional – also allow image update)
router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  updateProduct
);

// ADMIN: delete
router.delete("/:id", auth, deleteProduct);

module.exports = router;
