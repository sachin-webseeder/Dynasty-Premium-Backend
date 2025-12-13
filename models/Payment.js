// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: "UserSubscription", required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  amount: { type: Number, required: true },
  method: { type: String, enum: ["Razorpay", "Wallet", "COD"] },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  note: String
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
