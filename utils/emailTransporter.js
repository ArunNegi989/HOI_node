// utils/emailTransporter.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS, // ⚠️ Gmail APP PASSWORD (no spaces)
  },
});

console.log("📧 ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
console.log("📧 ADMIN_PASS length:", process.env.ADMIN_PASS?.length);

// verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("🔴 Nodemailer transporter error:", error);
  } else {
    console.log("✅ Nodemailer ready to send emails");
  }
});

module.exports = transporter;
