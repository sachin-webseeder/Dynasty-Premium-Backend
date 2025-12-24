// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, trim: true },
  fullName: { type: String },

  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },

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

  // Customer Only Fields
  addresses: [
    {
      name: String,
      flat: String,
      area: String,
      city: String,
      pincode: String,
      type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
      isDefault: { type: Boolean, default: false }
    }
  ],

cart: [
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    variantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: false ,
      default: null
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1, 
      default: 1 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  }
],
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  customerType: { type: String, enum: ["New", "Returning", "High-Value"], default: "New" }
}, { timestamps: true });

// Virtual displayName
userSchema.virtual('displayName').get(function () {
  return this.fullName || `${this.firstName} ${this.lastName || ''}`.trim();
});

// Pre-save logic
userSchema.pre('save', function(next) {
  this.fullName = `${this.firstName} ${this.lastName || ''}`.trim();

  if (this.role === "Admin") {
    this.panelAccess = true;
    this.permissions = ["dashboard", "inventory", "orders", "delivery", "customers", "reports", "products", "settings"];
  }

  if (this.role === "PanelUser") {
    this.panelAccess = true;
    if (this.permissions.length === 0) this.permissions = ["dashboard", "orders"];
  }

  if (this.role === "Customer") {
    this.panelAccess = false;
    this.permissions = [];
  }

  next();
});

export default mongoose.model("User", userSchema);