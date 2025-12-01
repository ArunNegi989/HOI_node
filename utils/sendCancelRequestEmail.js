// utils/sendCancelRequestEmail.js
const transporter = require("./emailTransporter");

const BRAND_COLOR = "#d63384";
const TEXT_COLOR = "#333333";
const ACCENT_BG = "#fff3f9";

// ⚠️ Tumhari .env me Frontend_URL hai (capital F)
const FRONTEND_URL = process.env.Frontend_URL || "http://localhost:3000";

function formatINR(amount) {
  if (!amount || isNaN(amount)) return "₹ 0.00";
  return `₹ ${Number(amount).toFixed(2)}`;
}

async function sendCancelRequestEmailToOwner(order) {
  // admin emails env se
  const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  if (!adminEmailsStr) {
    console.warn("⚠️ No ADMIN_EMAILS configured for cancel request emails.");
    return;
  }

  const adminEmails = adminEmailsStr.split(",").map((e) => e.trim());

  const adminOrderLink = `${FRONTEND_URL}/admin/orders/${order._id}`;

  const userName = order.user?.name || "Customer";
  const userEmail = order.user?.email || "";
  const totalAmount = order.grandTotal || 0;

  const reason = order.cancelReason || "Not specified";
  const note = order.cancelReasonNote || "";

  const itemsSummary = (order.items || [])
    .map((item) => {
      const name = item.name || "Product";
      const size = item.size ? ` | Size: ${item.size}` : "";
      const color = item.color ? ` | Color: ${item.color}` : "";
      const qty = item.quantity || 1;
      return `${name}${size}${color} (Qty: ${qty})`;
    })
    .join("<br/>");

  const html = `
  <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #f3e6ee;">
      <div style="background:${BRAND_COLOR}; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Order Cancellation Request</h2>
        <p style="margin:4px 0 0; font-size:13px;">House of Intimacy</p>
      </div>

      <div style="padding:18px 20px;">
        <p style="font-size:14px; color:${TEXT_COLOR}; margin-top:0;">
          <strong>${userName}</strong> (${userEmail}) has requested to cancel order id is
          <strong>${order.orderNumber || order._id}</strong>.
        </p>

        <div style="background:${ACCENT_BG}; padding:10px 12px; border-radius:8px; margin:10px 0;">
          <p style="font-size:13px; margin:0 0 4px;"><strong>Reason:</strong> ${reason}</p>
          ${
            note
              ? `<p style="font-size:13px; margin:0;"><strong>Details:</strong> ${note}</p>`
              : ""
          }
        </div>

        <h4 style="font-size:14px; margin:14px 0 6px;">Order summary</h4>
        <p style="font-size:13px; margin:0 0 6px;">
          <strong>Total:</strong> ${formatINR(totalAmount)}<br/>
          <strong>Payment:</strong> ${(order.paymentMethod || "").toUpperCase()}<br/>
          <strong>Placed on:</strong> ${
            order.createdAt ? new Date(order.createdAt).toLocaleString() : ""
          }
        </p>

        <div style="font-size:13px; margin:10px 0;">
          <strong>Items:</strong><br/>
          ${itemsSummary || "No items found"}
        </div>

        <div style="text-align:center; margin-top:16px;">
          <a href="${adminOrderLink}"
             style="display:inline-block; background:${BRAND_COLOR}; color:#ffffff; text-decoration:none; padding:10px 18px; border-radius:999px; font-size:14px;">
            Open this order in admin panel
          </a>
        </div>
      </div>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
    to: adminEmails,
    subject: `Cancellation request: ${order.orderNumber || order._id}`,
    html,
  });
}

module.exports = sendCancelRequestEmailToOwner;
