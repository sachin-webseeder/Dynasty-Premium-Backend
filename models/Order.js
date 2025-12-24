// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true }, // Auto-generated
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: String, 
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      variant: { label: String, value: Number, unit: String }
    }
  ],
  totalAmount: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 }, // Premium discount
  finalAmount: { type: Number, required: true },
 address: {
  name: { type: String, required: true },
  flat: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" }
},
  paymentMethod: { type: String, enum: ["COD", "Wallet", "Razorpay"], required: true },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
  orderStatus: {
    type: String,
    enum: ["Placed", "Confirmed", "Preparing", "OutForDelivery", "Delivered", "Cancelled"],
    default: "Placed"
  },
  deliveryDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

// Auto generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model("Order", orderSchema);