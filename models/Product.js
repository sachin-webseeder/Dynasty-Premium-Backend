// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  dishName: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  originalPrice: { type: Number }, 
  discountPercent: { type: Number, default: 0 }, 
  preparationTime: { type: Number },
  calories: { type: Number },
  description: { type: String },
  benefits: [String], 
  availableQuantities: [
    {
      label: { type: String }, // "500 ml"
      value: { type: Number }, // 500
      unit: { type: String },  // "ml"
      price: { type: Number }  // Optional per-quantity price
    }
  ],
  image: { type: String },
  availableForOrder: { type: Boolean, default: true },
  vegetarian: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// VIRTUAL: Calculate savings
productSchema.virtual("savings").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return (this.originalPrice - this.price).toFixed(2);
  }
  return null;
});

export default mongoose.model("Product", productSchema);