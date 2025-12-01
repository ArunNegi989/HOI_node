// middleware/adminOnly.js
module.exports = (req, res, next) => {
  try {
    if (!req.userRole || req.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }
    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(403).json({ message: "Forbidden" });
  }
};
