// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    dishName: {
      type: String,
      required: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    volume: {
      type: String,
      required: true
    },

    attributes: [String],

    price: {
      type: Number,
      required: true
    },

    originalPrice: {
      type: Number
    },

    discountPercent: {
      type: Number,
      default: 0
    },

    cost: {
      type: Number,
      required: true
    },

    preparationTime: {
      type: Number
    },

    calories: {
      type: Number
    },

    description: {
      type: String
    },

    benefits: [String],

    image: {
      type: String
    },

    availableForOrder: {
      type: Boolean,
      default: true
    },

    vegetarian: {
      type: Boolean,
      default: false
    },

    isVIP: {
      type: Boolean,
      default: false
    },

    stock: {
      type: Number,
      default: 0
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for savings
productSchema.virtual("savings").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    const savingAmount = this.originalPrice - this.price;
    const savingPercent = Math.round((savingAmount / this.originalPrice) * 100);

    return {
      amount: savingAmount.toFixed(2),
      percent: savingPercent
    };
  }
  return null;
});

export default mongoose.model("Product", productSchema);
