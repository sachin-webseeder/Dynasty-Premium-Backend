// models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  dishName: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  preparationTime: { type: Number },
  calories: { type: Number },
  description: { type: String },
  image: { type: String },
  availableForOrder: { type: Boolean, default: true },
  vegetarian: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);