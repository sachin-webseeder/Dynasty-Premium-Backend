// controllers/productController.js
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";

// Helpers
const toNum = (v) => (v === undefined || v === "" ? undefined : Number(v));
const parseJSON = (value, fallback = []) => {
  try {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

/*  ADD PRODUCT API */
export const addProduct = asyncHandler(async (req, res) => {
  const body = req.body;

  if (!body.dishName || !body.category) {
    return res.status(400).json({ success: false, message: "dishName & category are required" });
  }

  //payload
  const payload = {
    dishName: body.dishName.trim(),
    category: body.category.trim(),
    price: toNum(body.price),
    cost: toNum(body.cost),
    originalPrice: toNum(body.originalPrice),
    discountPercent: toNum(body.discountPercent) || 0,
    preparationTime: toNum(body.preparationTime),
    calories: toNum(body.calories),
    description: body.description || "",
    benefits: parseJSON(body.benefits),
    availableQuantities: parseJSON(body.availableQuantities),
    image: req.file ? `/uploads/${req.file.filename}` : null,
    availableForOrder: body.availableForOrder === "true" || body.availableForOrder === true,
    vegetarian: body.vegetarian === "true" || body.vegetarian === true,
    stock: toNum(body.stock) || 0,
    addedBy: req.user._id
  };

  const product = await Product.create(payload);

  res.status(201).json({
    success: true,
    message: "Product added",
    product
  });
});

/* GET PRODUCTS API */
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, platform } = req.query;

  //Base query
  const query = {};

  if (search) {
    query.dishName = { $regex: search, $options: "i" };
  }

  if (category && category !== "All") {
    query.category = category;
  }

  // Fetch products
  const products = await Product.find(query).sort({ createdAt: -1 });

  
  if (!products || products.length === 0) {
    return res.json({
      success: true,
      total: 0,
      products: []
    });
  }

  // MOBILE RESPONSE FORMAT
  if (platform === "mobile") {
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    const mobileFormatted = products.map((p) => ({
      id: p._id,
      name: p.dishName,
      price: p.price,
      image_url: p.image ? `${BASE_URL}/${p.image}` : null, 
      originalPrice: p.originalPrice || null,
      discount: p.discountPercent ? `${p.discountPercent}% OFF` : null,
      savings: p.savings ? `Savings ₹${p.savings}` : null,
      inStock: p.stock > 0
    }));

    return res.json({
      success: true,
      platform: "mobile",
      total: mobileFormatted.length,
      products: mobileFormatted
    });
  }

  // Default (WEB)
  res.json({
    success: true,
    total: products.length,
    products
  });
});


/* GET SINGLE PRODUCT API */
export const getProductById = asyncHandler(async (req, res) => {
  const { platform = "web" } = req.query;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  
  // MOBILE RESPONSE
  if (platform === "mobile") {
    return res.json({
      success: true,
      platform: "mobile",
      product: {
        id: product._id,
        name: product.dishName,
        price: product.price,
        image_url: product.image ? `${BASE_URL}${product.image}` : null,
        discount: product.discountPercent ? `${product.discountPercent}% OFF` : null,
        originalPrice: product.originalPrice || null,
        savings: product.savings ? `Savings ₹${product.savings}` : null,
        description: product.description || "",
        benefits: product.benefits || [],
        quantityOptions: product.availableQuantities?.map(q => ({
          label: q.label || `${q.value} ${q.unit}`,
          price: q.price || product.price
        })),
        inStock: product.stock > 0,
        vegetarian: product.vegetarian,
        preparationTime: product.preparationTime || 5
      }
    });
  }

  
  // WEB RESPONSE (FULL DATA)
  res.json({
    success: true,
    platform: "web",
    product
  });
});

/* UPDATE PRODUCT */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const body = req.body;

  // Simple merging
  Object.assign(product, {
    dishName: body.dishName?.trim() || product.dishName,
    category: body.category?.trim() || product.category,
    price: toNum(body.price) ?? product.price,
    cost: toNum(body.cost) ?? product.cost,
    originalPrice: toNum(body.originalPrice) ?? product.originalPrice,
    discountPercent: toNum(body.discountPercent) ?? product.discountPercent,
    preparationTime: toNum(body.preparationTime) ?? product.preparationTime,
    calories: toNum(body.calories) ?? product.calories,
    description: body.description ?? product.description,
    benefits: body.benefits ? parseJSON(body.benefits) : product.benefits,
    availableQuantities: body.availableQuantities
      ? parseJSON(body.availableQuantities)
      : product.availableQuantities,
    availableForOrder: body.availableForOrder === "true" ? true : product.availableForOrder,
    vegetarian: body.vegetarian === "true" ? true : product.vegetarian,
    stock: toNum(body.stock) ?? product.stock
  });

  // Handle image update
  if (req.file) {
    if (product.image) {
      const oldPath = path.join(process.cwd(), "uploads", path.basename(product.image));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    product.image = `/uploads/${req.file.filename}`;
  }

  await product.save();

  res.json({ success: true, message: "Product updated", product });
});

/* DELETE PRODUCT */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  // Remove image if exists
  if (product.image) {
    const filePath = path.join(process.cwd(), "uploads", path.basename(product.image));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  await product.deleteOne();

  res.json({ success: true, message: "Product deleted" });
});
