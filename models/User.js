import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Manager', 'Delivery', 'Customer'],
    default: 'Customer'
  },
  permissions: { type: Object, default: {} },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('User', userSchema);