// controllers/cartController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Product from "../models/Product.js";

// ADD TO CART
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: "productId required" });
  }

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

 
  if (variantId) {
    const variant = product.availableQuantities.find(v => v._id.toString() === variantId);
    if (!variant) return res.status(404).json({ success: false, message: "Variant not found" });
    if (variant.stock < quantity) return res.status(400).json({ success: false, message: "Out of stock" });
  }

  const user = await User.findById(req.user._id);

  // Existing item check (variantId optional)
  const existingIndex = user.cart.findIndex(item => 
    item.product.toString() === productId && 
    (item.variantId ? item.variantId.toString() : null) === (variantId || null)
  );

  if (existingIndex > -1) {
    user.cart[existingIndex].quantity += quantity;
  } else {
    user.cart.push({
      product: productId,
      variantId: variantId || null,  
      quantity
    });
  }

  await user.save();

  // Populate response
  await user.populate("cart.product");

  const populatedCart = user.cart.map(item => {
    const variant = item.variantId 
      ? item.product.availableQuantities.find(v => v._id.toString() === item.variantId.toString())
      : null;

    return {
      cartItemId: item._id,
      product: {
        id: item.product._id,
        dishName: item.product.dishName,
        image: item.product.image
      },
      variant: variant ? {
        label: variant.label,
        value: variant.value,
        unit: variant.unit,
        price: variant.price
      } : null,
      quantity: item.quantity
    };
  });

  const cartCount = user.cart.reduce((sum, item) => sum + item.quantity, 0);

  res.json({
    success: true,
    message: "Added to cart",
    cart: populatedCart,
    cartCount
  });
});
// UPDATE QUANTITY
export const updateCartQuantity = asyncHandler(async (req, res) => {
  const { cartItemId, quantity } = req.body;

  if (!cartItemId || quantity < 1) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }

  const user = await User.findById(req.user._id);

  const cartItem = user.cart.id(cartItemId);
  if (!cartItem) return res.status(404).json({ success: false, message: "Item not in cart" });

  // Stock check
  const product = await Product.findById(cartItem.product);
  const variant = product.availableQuantities.id(cartItem.variantId);
  if (variant.stock < quantity) {
    return res.status(400).json({ success: false, message: "Not enough stock" });
  }

  cartItem.quantity = quantity;
  await user.save();

  await populateCart(user);

  res.json({
    success: true,
    message: "Quantity updated",
    cart: user.populatedCart,
    cartCount: user.cartCount
  });
});

// REMOVE FROM CART
export const removeFromCart = asyncHandler(async (req, res) => {
  const { cartItemId } = req.body;

  if (!cartItemId) {
    return res.status(400).json({ success: false, message: "cartItemId required" });
  }

  const user = await User.findById(req.user._id);
  user.cart.id(cartItemId)?.remove();

  await user.save();
  await populateCart(user);

  res.json({
    success: true,
    message: "Removed from cart",
    cart: user.populatedCart,
    cartCount: user.cartCount
  });
});

// GET CART
export const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  await populateCart(user);

  res.json({
    success: true,
    cart: user.populatedCart,
    cartCount: user.cartCount,
    subtotal: user.subtotal || 0
  });
});

// CLEAR CART
export const clearCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.cart = [];
  await user.save();

  res.json({
    success: true,
    message: "Cart cleared",
    cart: [],
    cartCount: 0
  });
});

// HELPER FUNCTION – POPULATE CART WITH VARIANT DETAILS
const populateCart = async (user) => {
  await user.populate({
    path: "cart.product",
    select: "dishName price image availableQuantities"
  });

  const populatedCart = user.cart.map(item => {
    const variant = item.product.availableQuantities.id(item.variantId);
    return {
      cartItemId: item._id,
      product: {
        id: item.product._id,
        dishName: item.product.dishName,
        image: item.product.image
      },
      variant: variant ? {
        label: variant.label,
        value: variant.value,
        unit: variant.unit,
        price: variant.price,
        stock: variant.stock
      } : null,
      quantity: item.quantity
    };
  });

  const cartCount = user.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = populatedCart.reduce((total, item) => {
    return total + (item.variant?.price || 0) * item.quantity;
  }, 0);

  user.populatedCart = populatedCart;
  user.cartCount = cartCount;
  user.subtotal = subtotal;
};