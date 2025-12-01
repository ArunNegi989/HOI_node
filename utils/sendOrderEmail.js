// utils/sendOrderEmail.js
const transporter = require("./emailTransporter");

const BRAND_COLOR = "#d63384"; // HOI Pink
const TEXT_COLOR = "#333333";
const ACCENT_BG = "#fff3f9";

// Frontend base (track link ke liye)
const FRONTEND_URL = process.env.Frontend_URL || "http://localhost:3000";

// ---- EMAIL WRAPPER (TABLE-BASED, EMAIL SAFE) ----
const emailWrapper = (content, preheader = "") => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>House of Intimacy</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f5f5;">
    <!-- PREHEADER (hidden in most clients, but shows as preview text) -->
    <span style="display:none; font-size:1px; color:#f5f5f5; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      ${preheader}
    </span>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5; padding:20px 0;">
      <tr>
        <td align="center">
          <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:10px; border:1px solid #f0d2e2; overflow:hidden;">
            
            <!-- HEADER -->
            <tr>
              <td align="left" style="background-color:${BRAND_COLOR}; padding:18px 24px; color:#ffffff;">
                <div style="font-size:24px; font-weight:bold;">House of Intimacy</div>
                <div style="font-size:11px; opacity:0.9;">Elegance • Comfort • Confidence</div>
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:24px 24px 18px; font-family:Arial, sans-serif;">
                ${content}
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center" style="background-color:#fff7fc; padding:14px 10px 18px; font-family:Arial, sans-serif;">
                <p style="margin:4px 0; font-size:12px; color:#777;">Need help? We’re here for you 💌</p>
                <p style="margin:4px 0; font-size:12px; color:#777;">Email: <b>support@hoi.in</b></p>
                <p style="margin:4px 0; font-size:11px; color:#aaa;">© ${new Date().getFullYear()} House of Intimacy. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

// ---- HELPERS ----
const getOrderLabel = (order) =>
  order.orderNumber || order._id.toString().slice(-6).toUpperCase();

const CTA_BUTTON = (text, url) => `
  <table border="0" cellspacing="0" cellpadding="0" style="margin-top:18px;">
    <tr>
      <td align="center" bgcolor="${BRAND_COLOR}" style="border-radius:999px;">
        <a href="${url}"
          style="
            display:inline-block;
            padding:10px 24px;
            font-size:13px;
            font-weight:bold;
            color:#ffffff;
            text-decoration:none;
            font-family:Arial, sans-serif;
          ">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`;

const ORDER_SUMMARY = (order) => `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" 
         style="margin-top:18px; background-color:${ACCENT_BG}; border-radius:8px; padding:0;">
    <tr>
      <td style="padding:12px 14px 6px; font-family:Arial, sans-serif;">
        <span style="font-size:14px; font-weight:bold; color:${TEXT_COLOR};">
          Order Summary
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:0 14px 12px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px; font-family:Arial, sans-serif;">
          <tr>
            <td style="padding:4px 0; color:#555;">Order No:</td>
            <td style="padding:4px 0; text-align:right; font-weight:bold;">${
              order.orderNumber
            }</td>
          </tr>
          <tr>
            <td style="padding:4px 0; color:#555;">Total Amount:</td>
            <td style="padding:4px 0; text-align:right; font-weight:bold; color:${BRAND_COLOR};">
              ₹${order.grandTotal}
            </td>
          </tr>
          ${
            order.itemsTotal
              ? `<tr>
                  <td style="padding:4px 0; color:#555;">Items total:</td>
                  <td style="padding:4px 0; text-align:right;">₹${order.itemsTotal}</td>
                 </tr>`
              : ""
          }
          ${
            order.discountTotal
              ? `<tr>
                  <td style="padding:4px 0; color:#555;">Discount:</td>
                  <td style="padding:4px 0; text-align:right; color:#16a34a;">-₹${order.discountTotal}</td>
                 </tr>`
              : ""
          }
          ${
            order.shippingFee !== undefined
              ? `<tr>
                  <td style="padding:4px 0; color:#555;">Shipping:</td>
                  <td style="padding:4px 0; text-align:right;">
                    ${
                      order.shippingFee === 0
                        ? "<span style='color:#16a34a;'>FREE</span>"
                        : `₹${order.shippingFee}`
                    }
                  </td>
                 </tr>`
              : ""
          }
          <tr>
            <td style="padding:6px 0; color:#555;">Payment:</td>
            <td style="padding:6px 0; text-align:right;">
              <b>${order.paymentMethod}</b> • ${order.paymentStatus}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const FRIENDLY_NOTE = `
  <p style="font-size:12px; color:#777; margin:16px 0 4px;">
    ✨ <b>Gentle reminder:</b> For best comfort and longevity, wash your HOI pieces gently and dry them in shade.
  </p>
`;

// ---- TEMPLATES PER STATUS ----
const TEMPLATES = {
  PLACED: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Your order is placed 🎉
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Thank you for choosing <b>House of Intimacy</b> 💗<br/>
        We’ve received your order and our team is already on it! 
        You’ll get updates at every important step – from confirmation to shipping to delivery.
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 6px;">
        Here’s what happens next:
      </p>
      <ul style="font-size:13px; color:#555; padding-left:18px; margin:0 0 10px;">
        <li>Your order will be confirmed and queued for packing.</li>
        <li>Once packed, it’ll be handed over to our delivery partner.</li>
        <li>We’ll notify you again when it’s shipped and out for delivery.</li>
      </ul>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("Track / View Your Order", `${FRONTEND_URL}/account/orders`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order has been placed successfully."
    ),

  CONFIRMED: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Order confirmed ✔️
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Great news! Your order has been <b>confirmed</b> and is moving into our packing studio.
        Our team will carefully verify your styles, sizes, and colors so your HOI experience feels perfect.
      </p>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        You’ll receive another update when your parcel has been <b>shipped</b>.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("View Order Details", `${FRONTEND_URL}/account/orders`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order is confirmed."
    ),

  PROCESSING: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        We’re preparing your package 🛍️
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Your order is now <b>being packed</b> in our studio.
        Each piece is checked for quality, comfort and finish before it leaves us, so your unboxing feels truly special.
      </p>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        As soon as it is shipped, we’ll send you another update.
      </p>

      ${ORDER_SUMMARY(order)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order is being processed."
    ),

  SHIPPED: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Your order is on the way 🚚✨
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Your HOI parcel has been <b>shipped</b> and is now with our delivery partner.
        It’s on its way to you – we can’t wait for you to try everything on!
      </p>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        You can check the latest status anytime from your account.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("Track Live Status", `${FRONTEND_URL}/account/orders`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order has been shipped."
    ),

  OUT_FOR_DELIVERY: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Out for delivery 📦
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Your HOI order is <b>out for delivery</b> and should reach you today.
        Please keep your phone reachable and, if it’s a COD order, the amount handy for a smooth delivery.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("View Delivery Details", `${FRONTEND_URL}/account/orders`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order is out for delivery."
    ),

  DELIVERED: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Delivered 💝
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Your order has been <b>delivered</b> – we hope your new favourites make you feel confident, comfortable and celebrated 💫
      </p>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        If something doesn’t feel right with your order, just reach out to us and we’ll be happy to help.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("Explore More Styles", `${FRONTEND_URL}/shop`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order has been delivered."
    ),

  CANCELLED: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Order cancelled ❌
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        Your order has been <b>cancelled</b> as per the latest update.
        ${
          order.paymentStatus === "REFUNDED"
            ? "Any eligible amount will be refunded as per our refund policy."
            : "If you paid online and are eligible for a refund, it will be processed as per our policy."
        }
      </p>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        If this was not requested by you, or if you have any questions, please contact our support team.
      </p>

      ${ORDER_SUMMARY(order)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI order has been cancelled."
    ),

  PAYMENT_SUCCESS: (name, order) =>
    emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        Payment received 💳✔️
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 8px;">
        Hi <b>${name}</b>,
      </p>
      <p style="font-size:13px; color:#555; line-height:1.6; margin:0 0 10px;">
        We’ve successfully received your payment for this order. 
        Your items will now move into <b>confirmation</b> and <b>processing</b>.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("View Order", `${FRONTEND_URL}/account/orders`)}

      ${FRIENDLY_NOTE}
    `,
      "Your HOI payment was successful."
    ),
};

// ---- SEND FUNCTIONS ----
const sendOrderEmailToCustomer = async (order, event) => {
  try {
    const toEmail = order.user?.email;
    const name = order.shippingAddress?.name || order.user?.name || "Customer";

    if (!toEmail) {
      console.log("⚠️ No user email found on order, skipping customer email.");
      return;
    }

    const templateFn = TEMPLATES[event];
    if (!templateFn) {
      console.log("⚠️ No email template defined for event:", event);
      return;
    }

    const html = templateFn(name, order);
    const subject = `HOI – Order ${event.replace(/_/g, " ")} (${getOrderLabel(
      order
    )})`;

    await transporter.sendMail({
      from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
      to: toEmail,
      subject,
      html,
    });

    console.log("📧 Customer Email Sent:", event, "to", toEmail);
  } catch (err) {
    console.error("sendOrderEmailToCustomer error:", err);
  }
};

const sendNewOrderEmailToOwner = async (order) => {
  try {
    const ownerEmail = process.env.ADMIN_EMAILS;

    if (!ownerEmail) {
      console.log("⚠️ No ADMIN_EMAIL set, skipping owner email.");
      return;
    }

    const html = emailWrapper(
      `
      <h2 style="color:${TEXT_COLOR}; font-size:20px; margin:0 0 8px;">
        New order received 🔔
      </h2>
      <p style="font-size:13px; color:#555; margin:0 0 10px;">
        A new order has been placed on <b>House of Intimacy</b>. Please review and process it from your admin panel.
      </p>

      ${ORDER_SUMMARY(order)}

      ${CTA_BUTTON("Open Admin Dashboard", `${FRONTEND_URL}/admin/orders`)}
    `,
      "New HOI order received."
    );

    const subject = `New Order – ${getOrderLabel(order)}`;

    await transporter.sendMail({
      from: `"House of Intimacy" <${process.env.ADMIN_EMAIL}>`,
      to: ownerEmail,
      subject,
      html,
    });

    console.log("📧 Owner Email Sent");
  } catch (err) {
    console.error("sendNewOrderEmailToOwner error:", err);
  }
};

module.exports = {
  sendOrderEmailToCustomer,
  sendNewOrderEmailToOwner,
};
