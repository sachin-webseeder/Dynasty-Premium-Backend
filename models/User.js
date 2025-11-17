// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["SuperAdmin", "Admin", "Customer"],
    default: "Customer"
  },
  isEnabled: { type: Boolean, default: true },
  addresses: [/* ... */],
  cart: [/* ... */],
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrder: { type: Date },
  customerType: {
    type: String,
    enum: ["New", "Returning", "High-Value"],
    default: "New"
  }
}, { timestamps: true });

// AUTO CUSTOMER TYPE
userSchema.pre('save', function(next) {
  if (this.role !== "Customer") return next();
  if (this.totalOrders >= 20 && this.totalSpent >= 15000) this.customerType = "High-Value";
  else if (this.totalOrders >= 5) this.customerType = "Returning";
  else this.customerType = "New";
  next();
});

export default mongoose.model("User", userSchema);