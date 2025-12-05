// routes/shippingRoutes.js
const express = require("express");
const router = express.Router();

const { isCodAllowedForPincode } = require("../config/codConfig");

// GET /v1/shipping/check-pincode/:pin
router.get("/check-pincode/:pin", (req, res) => {
  const pin = req.params.pin;
  const codAllowed = isCodAllowedForPincode(pin);

  return res.json({
    pincode: pin,
    codAllowed,
    message: codAllowed
      ? "COD is available for this Dehradun pincode."
      : "COD is available only within Dehradun serviceable pincodes.",
  });
});

module.exports = router;
