// models/MembershipPlan.js
import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "90 Days Premium Pass"
  description: { type: String, required: true }, // "Daily Morning Delivery"
  durationDays: { type: Number, required: true }, // 90
  originalPrice: { type: Number, required: true }, // 4199
  discountPrice: { type: Number, required: true }, // 1414
  discountPercent: { type: Number, default: 0 }, // 66
  savings: { type: String, required: true }, // "You Save ₹2585"
  benefits: [String], // ["Up to 80% OFF", "Free Delivery"]
  isActive: { type: Boolean, default: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("MembershipPlan", membershipPlanSchema);