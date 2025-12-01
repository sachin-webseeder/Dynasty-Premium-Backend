// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  fullName: { type: String },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },

  // ONLY 3 ROLES
  role: {
    type: String,
    enum: ["Admin", "PanelUser", "Customer"],
    default: "Customer"
  },

  panelAccess: { type: Boolean, default: false },

  permissions: {
    type: [String],
    default: [],
    enum: ["dashboard", "inventory", "orders", "delivery", "customers", "reports", "products", "settings"]
  },

  isEnabled: { type: Boolean, default: true },

  // Customer fields
  addresses: [{ type: mongoose.Schema.Types.Mixed }],
  cart: [{ type: mongoose.Schema.Types.Mixed }],
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  customerType: { type: String, enum: ["New", "Returning", "High-Value"], default: "New" }
}, { timestamps: true });

// Virtual + Pre-save
userSchema.virtual('displayName').get(function () {
  return this.fullName || `${this.firstName} ${this.lastName || ''}`.trim();
});

userSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName || ''}`.trim();

  // Admin gets full access
  if (this.role === "Admin") {
    this.panelAccess = true;
    this.permissions = ["dashboard", "inventory", "orders", "delivery", "customers", "reports", "products", "settings"];
  }

  // PanelUser gets panel access
  if (this.role === "PanelUser") {
    this.panelAccess = true;
    if (this.permissions.length === 0) {
      this.permissions = ["dashboard", "orders"];
    }
  }

  // Customer no panel access
  if (this.role === "Customer") {
    this.panelAccess = false;
    this.permissions = [];
  }

  next();
});

export default mongoose.model("User", userSchema);