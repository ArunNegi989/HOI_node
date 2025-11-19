// controllers/users/index.js
const Users = require("../../models/User");

exports.getUserdata = async (req, res) => {
  try {
    const user = await Users.findById(req.userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User data fetched successfully",
      user,
    });
  } catch (err) {
    console.error("Get user data error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
