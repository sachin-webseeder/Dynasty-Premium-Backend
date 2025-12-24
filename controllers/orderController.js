// controllers/orderController.js
import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

// PLACE ORDER (Customer)
export const placeOrder = asyncHandler(async (req, res) => {
  const { address, paymentMethod, notes } = req.body;

  const user = await User.findById(req.user._id).populate("cart.product");
  if (user.cart.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  let total = 0;
  const items = user.cart.map(item => {
    const price = item.selectedVariant?.price || item.product.price;
    total += price * item.quantity;
    return {
      product: item.product._id,
      name: item.product.dishName,
      quantity: item.quantity,
      price,
      variant: item.selectedVariant
    };
  });

  // Premium discount (example 10%)
  const discount = user.isPremium ? total * 0.10 : 0;
  const finalAmount = total - discount;

  const order = await Order.create({
    customer: req.user._id,
    items,
    totalAmount: total,
    discountApplied: discount,
    finalAmount,
    address,
    paymentMethod,
    notes
  });

  // Clear cart
  user.cart = [];
  await user.save();

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order
  });
});

// GET MY ORDERS (Customer)
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate("items.product", "dishName image");

  res.json({ success: true, orders });
});

// GET SINGLE ORDER DETAIL (Customer)
export const getOrderDetail = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customer: req.user._id
  }).populate("items.product");

  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  res.json({ success: true, order });
});

// ADMIN: GET ALL ORDERS
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  let query = {};
  if (status) query.orderStatus = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  const orders = await Order.find(query)
    .populate("customer", "firstName phone")
    .populate("items.product", "dishName")
    .sort({ createdAt: -1 });

  const stats = {
    total: await Order.countDocuments(),
    today: await Order.countDocuments({ 
      createdAt: { $gte: new Date().setHours(0,0,0,0) }
    }),
    pending: await Order.countDocuments({ paymentStatus: "Pending" }),
    delivered: await Order.countDocuments({ orderStatus: "Delivered" })
  };

  res.json({ success: true, stats, orders });
});

// ADMIN: UPDATE ORDER STATUS
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  order.orderStatus = status;
  if (status === "Delivered") order.paymentStatus = "Paid";

  await order.save();
  res.json({ success: true, message: "Order status updated", order });
});


