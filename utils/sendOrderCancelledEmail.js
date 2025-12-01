// utils/sendOrderCancelledEmail.js
const transporter = require('./emailTransporter');

const BRAND_COLOR = '#d63384';
const TEXT_COLOR = '#333333';
const ACCENT_BG = '#fff3f9';

const FRONTEND_URL = process.env.Frontend_URL || 'http://localhost:3000';
const ADMIN_ORDERS_URL =
  process.env.ADMIN_ORDERS_URL || `${FRONTEND_URL}/admin/orders`;

function formatINR(amount) {
  if (!amount || isNaN(amount)) return '₹ 0.00';
  return `₹ ${Number(amount).toFixed(2)}`;
}

function buildCancelledHtml(order, isAdmin, user) {
  const totalAmount =
    order.totalAmount || order.grandTotal || order.amount || 0;
  const userName = user?.name || 'Customer';
  const userEmail = user?.email || '';

  const itemsSummary = (order.items || [])
    .map((item) => {
      const name = item.name || item.productName || 'Product';
      const size = item.size ? ` | Size: ${item.size}` : '';
      const color = item.color ? ` | Color: ${item.color}` : '';
      const qty = item.quantity || item.qty || 1;
      return `${name}${size}${color} (Qty: ${qty})`;
    })
    .join('<br/>');

  const orderLinkUser = `${FRONTEND_URL}/account/orders/${order._id}`;
  const orderLinkAdmin = `${ADMIN_ORDERS_URL}/${order._id}`;

  return `
  <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #f3e6ee;">
      <div style="background:${BRAND_COLOR}; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">Order Cancelled</h2>
        <p style="margin:4px 0 0; font-size:13px;">House of Intimacy</p>
      </div>

      <div style="padding:18px 20px;">
        <p style="font-size:14px; color:${TEXT_COLOR}; margin-top:0;">
          ${
            isAdmin
              ? `Order <strong>${order.orderNumber || order._id}</strong> has been cancelled.`
              : `Hi ${userName},<br/>Your order <strong>${
                  order.orderNumber || order._id
                }</strong> has been cancelled.`
          }
        </p>

        <div style="background:${ACCENT_BG}; padding:10px 12px; border-radius:8px; margin:10px 0;">
          <p style="font-size:13px; margin:0 0 4px;">
            <strong>Total:</strong> ${formatINR(totalAmount)}<br/>
            <strong>Payment:</strong> ${(order.paymentMethod || '').toUpperCase()}
          </p>
          ${
            order.paymentStatus
              ? `<p style="font-size:13px; margin:4px 0 0;">
                  <strong>Payment status:</strong> ${order.paymentStatus}
                 </p>`
              : ''
          }
        </div>

        <h4 style="font-size:14px; margin:14px 0 6px;">Order summary</h4>
        <p style="font-size:13px; margin:0 0 6px;">
          <strong>Placed on:</strong> ${
            order.createdAt ? new Date(order.createdAt).toLocaleString() : ''
          }<br/>
          <strong>Cancelled at:</strong> ${
            order.cancelApprovedAt
              ? new Date(order.cancelApprovedAt).toLocaleString()
              : new Date().toLocaleString()
          }
        </p>

        <div style="font-size:13px; margin:10px 0;">
          <strong>Items:</strong><br/>
          ${itemsSummary || 'No items found'}
        </div>

        <div style="text-align:center; margin-top:16px;">
          <a href="${isAdmin ? orderLinkAdmin : orderLinkUser}"
             style="display:inline-block; background:${BRAND_COLOR}; color:#ffffff; text-decoration:none; padding:10px 18px; border-radius:999px; font-size:14px;">
            View this order
          </a>
        </div>

        ${
          !isAdmin
            ? `<p style="font-size:12px; color:#777; margin-top:14px;">
                 If you paid online, your refund (if applicable) will be processed as per our refund policy.
               </p>`
            : ''
        }
      </div>
    </div>
  </div>
  `;
}

async function sendOrderCancelledEmails(order, user) {
  const adminEmailsStr = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL;
  const adminEmails = adminEmailsStr
    ? adminEmailsStr.split(',').map((e) => e.trim())
    : [];

  const userEmail = user?.email;

  // User email
  if (userEmail) {
    await transporter.sendMail({
      from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
      to: userEmail,
      subject: `Your order ${order.orderNumber || order._id} has been cancelled`,
      html: buildCancelledHtml(order, false, user),
    });
  }

  // Admin email(s)
  if (adminEmails.length > 0) {
    await transporter.sendMail({
      from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
      to: adminEmails,
      subject: `Order cancelled: ${order.orderNumber || order._id}`,
      html: buildCancelledHtml(order, true, user),
    });
  }
}

module.exports = sendOrderCancelledEmails;
