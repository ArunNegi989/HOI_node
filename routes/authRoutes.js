// backend/routes/authRoutes.js
const express = require("express");
const AuthRoutes = require('../controllers/Auth/routes');
const router = express.Router();

router.use('/auth',AuthRoutes);

module.exports = router;
