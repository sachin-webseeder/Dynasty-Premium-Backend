// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    displayName: {
      type: String,
      required: true
    },
    icon: {
      type: String
    },
    image: {
      type: String
    },
    sortOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
