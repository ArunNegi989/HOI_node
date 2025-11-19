// middleware/auth.js
const jwt = require("jsonwebtoken");

const JWT_KEY = process.env.JWT_KEY || "dev_secret_key";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_KEY, (err, decoded) => {
      if (err) {
        console.log("JWT VERIFY ERROR:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      req.userId = decoded.id;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
