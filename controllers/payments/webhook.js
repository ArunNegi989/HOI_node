// controllers/payments/webhook.js
const Orders = require("../../models/Order");
const { sendOrderEmailToCustomer } = require("../../utils/sendOrderEmail");

// TODO: implement this according to Razorpay docs
const parseGatewayPayload = (body) => {
  // Example:
  // return { orderId: body.payload.payment.entity.order_id, paymentId: body.payload.payment.entity.id, status: "SUCCESS" }
  return { orderId: "", paymentId: "", status: "FAILED" };
};

exports.paymentWebhook = async (req, res) => {
  try {
    const { orderId, paymentId, status } = parseGatewayPayload(req.body);

    const order = await Orders.findOne({ razorpayOrderId: orderId }).populate(
      "user",
      "name email"
    );
    if (!order) return res.status(404).end();

    if (status === "SUCCESS") {
      order.paymentStatus = "PAID";
      order.razorpayPaymentId = paymentId;
      order.status = "CONFIRMED";
      await order.save();

      await sendOrderEmailToCustomer(order.toObject(), "PAYMENT_SUCCESS");
    } else {
      order.paymentStatus = "FAILED";
      await order.save();
    }

    return res.status(200).end();
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).end();
  }
};
