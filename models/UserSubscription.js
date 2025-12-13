// models/UserSubscription.js
import mongoose from "mongoose";

const userSubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  paymentMethod: { type: String, enum: ["Razorpay", "Wallet", "COD"] },
  paymentStatus: { type: String, enum: ["Paid", "Pending", "Failed"], default: "Pending" },
  transactionId: { type: String }
}, { timestamps: true });

export default mongoose.model("UserSubscription", userSubscriptionSchema);