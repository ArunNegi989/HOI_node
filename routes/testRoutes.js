// routes/testRoutes.js
const express = require("express");
const router = express.Router();

const transporter = require("../utils/emailTransporter");

router.get("/send-test-email", async (req, res) => {
  try {
    const to = req.query.to || process.env.ADMIN_EMAIL;

    console.log("📨 Test email route hit, sending to:", to);

    const info = await transporter.sendMail({
      from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
      to,
      subject: "HOI Test Email",
      html: "<p>If you see this, email config is working ✅</p>",
    });

    console.log("✅ Test email sent. MessageId:", info.messageId);
    console.log("✅ Full info:", info);

    return res.json({
      success: true,
      message: "Test email sent",
      info,
    });
  } catch (err) {
    console.error("🔴 Test email error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: err.message,
    });
  }
});

module.exports = router;
