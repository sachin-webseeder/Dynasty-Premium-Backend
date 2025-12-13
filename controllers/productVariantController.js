import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id) &&
  /^[0-9a-fA-F]{24}$/.test(id);

/**
 * =========================
 * ADD VARIANT
 * =========================
 */
export const addVariant = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const body = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ success: false, message: "Invalid product ID" });
  }

  // REQUIRED BY SCHEMA
  if (!body.label || !body.value || !body.unit) {
    return res.status(400).json({
      success: false,
      message: "label, value and unit are required",
    });
  }

  const allowedUnits = ["ml", "kg", "gm"];
  if (!allowedUnits.includes(body.unit)) {
    return res.status(400).json({
      success: false,
      message: "unit must be ml, kg or gm",
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const variant = {
    label: body.label.trim(),
    value: Number(body.value),
    unit: body.unit,
    price: body.price ? Number(body.price) : undefined,
    stock: body.stock ? Number(body.stock) : 0,
    image: req.file ? `/uploads/${req.file.filename}` : undefined,
  };

  product.availableQuantities.push(variant);
  await product.save();

  res.status(201).json({
    success: true,
    message: "Variant added successfully",
    variant,
  });
});

/**
 * =========================
 * UPDATE VARIANT
 * =========================
 */
export const updateVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const body = req.body;

  if (!isValidObjectId(productId) || !isValidObjectId(variantId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product or variant ID",
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const variant = product.availableQuantities.id(variantId);
  if (!variant) {
    return res.status(404).json({ success: false, message: "Variant not found" });
  }

  if (body.label) variant.label = body.label.trim();
  if (body.value !== undefined) variant.value = Number(body.value);
  if (body.unit) variant.unit = body.unit;
  if (body.price !== undefined) variant.price = Number(body.price);
  if (body.stock !== undefined) variant.stock = Number(body.stock);

  if (req.file) {
    if (variant.image) {
      const oldPath = path.join(process.cwd(), "uploads", path.basename(variant.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    variant.image = `/uploads/${req.file.filename}`;
  }

  await product.save();

  res.json({
    success: true,
    message: "Variant updated successfully",
    variant,
  });
});

/**
 * =========================
 * DELETE VARIANT
 * =========================
 */
export const deleteVariant = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;

  if (!isValidObjectId(productId) || !isValidObjectId(variantId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product or variant ID",
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const variant = product.availableQuantities.id(variantId);
  if (!variant) {
    return res.status(404).json({ success: false, message: "Variant not found" });
  }

  if (variant.image) {
    const filePath = path.join(process.cwd(), "uploads", path.basename(variant.image));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  variant.deleteOne();
  await product.save();

  res.json({
    success: true,
    message: "Variant deleted successfully",
  });
});
