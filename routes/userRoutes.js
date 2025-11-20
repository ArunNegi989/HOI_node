// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  getUserdata,
  getAllUsers,
  deleteUser,
} = require("../controllers/Users/index");

// GET /v1/users/userdata → logged in user
router.get("/userdata", auth, getUserdata);

// GET /v1/users → all users (admin-only ideally)
router.get("/", auth, getAllUsers);

// DELETE /v1/users/:id → delete one user
router.delete("/:id", auth, deleteUser);

module.exports = router;
