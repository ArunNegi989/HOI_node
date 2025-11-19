// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { getUserdata } = require("../controllers/Users/index");

// GET /v1/users/userdata (protected)
router.get("/userdata", auth, getUserdata);

module.exports = router;
