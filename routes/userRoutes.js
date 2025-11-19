// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { getUserdata } = require("../controllers/users/index");

// GET /v1/users/userdata
router.get("/userdata", auth, getUserdata);

module.exports = router;
