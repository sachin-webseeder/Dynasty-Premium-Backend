import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    dishName: { type: String, required: true },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    volume: { type: String },

    availableQuantities: [
      {
        label: { type: String, required: true },
        value: { type: Number, required: true },
        unit: { type: String, enum: ["ml", "kg", "gm"], required: true },
        price: { type: Number, required: false },
        stock: { type: Number, required: true, default: 0 },
        image: { type: String }, // optional image per quantity
      },
    ],

    attributes: [String],

    // 💰 Pricing fields
    originalPrice: { type: Number, required: true },   // MRP
    price: { type: Number, required: true },           // Selling Price
    discountPercent: { type: Number, default: null },  // Manual discount (optional)
    cost: { type: Number, required: true },            // Internal cost

    description: { type: String },
    benefits: [String],
    image: { type: String },

    availableForOrder: { type: Boolean, default: true },
    vegetarian: { type: Boolean, default: false },
    isVIP: { type: Boolean, default: false },

    stock: { type: Number, default: 0 },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔹 Virtual field for savings (auto-calc if discountPercent not set)
productSchema.virtual("savings").get(function () {
  if (this.discountPercent !== null) {
    // Agar manually discount set hai
    const savingAmount = (this.originalPrice * this.discountPercent) / 100;
    return {
      amount: savingAmount.toFixed(2),
      percent: this.discountPercent,
    };
  } else if (this.originalPrice && this.originalPrice > this.price) {
    // Agar manually discount nahi diya, to auto calculate
    const savingAmount = this.originalPrice - this.price;
    const savingPercent = Math.round((savingAmount / this.originalPrice) * 100);

    return {
      amount: savingAmount.toFixed(2),
      percent: savingPercent,
    };
  }
  return null;
});

export default mongoose.model("Product", productSchema);