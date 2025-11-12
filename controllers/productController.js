// controllers/productController.js
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";
import path from "path";
import fs from "fs";

// ADD PRODUCT
export const addProduct = asyncHandler(async (req, res) => {
  const {
    dishName,
    category,
    price,
    cost,
    preparationTime,
    calories,
    description,
    availableForOrder,
    vegetarian,
    stock,
  } = req.body;

  if (!dishName || !category || !price || !cost) {
    res.status(400);
    throw new Error("Please provide all required fields: dishName, category, price, cost");
  }

  const image = req.file ? `/uploads/${req.file.filename}` : "";

  const product = await Product.create({
    dishName,
    category,
    price,
    cost,
    preparationTime,
    calories,
    description,
    image,
    availableForOrder: availableForOrder === "true",
    vegetarian: vegetarian === "true",
    stock: stock || 0,
    addedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// GET ALL PRODUCTS
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, available, vegetarian } = req.query;

  let query = {};

  if (search) query.dishName = { $regex: search, $options: "i" };
  if (category && category !== "All") query.category = category;
  if (available) query.availableForOrder = available === "true";
  if (vegetarian) query.vegetarian = vegetarian === "true";

  const products = await Product.find(query)
    .populate("addedBy", "firstName email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    total: products.length,
    products,
  });
});

// GET SINGLE PRODUCT
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "addedBy",
    "firstName email"
  );

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    success: true,
    product,
  });
});

// UPDATE PRODUCT
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const updates = req.body;

  // Handle image update
  if (req.file) {
    // Delete old image
    if (product.image) {
      const oldImagePath = path.join(process.cwd(), "uploads", path.basename(product.image));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    updates.image = `/uploads/${req.file.filename}`;
  }

  // Update only provided fields
  Object.keys(updates).forEach((key) => {
    if (updates[key] === "true" || updates[key] === "false") {
      product[key] = updates[key] === "true";
    } else if (updates[key] !== undefined && updates[key] !== "") {
      product[key] = updates[key];
    }
  });

  await product.save();

  res.json({
    success: true,
    product,
  });
});

// DELETE PRODUCT
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Delete image from server
  if (product.image) {
    const imagePath = path.join(process.cwd(), "uploads", path.basename(product.image));
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await Product.deleteOne({ _id: req.params.id });

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});