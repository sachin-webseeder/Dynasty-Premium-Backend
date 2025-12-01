// controllers/productController.js
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import asyncHandler from "express-async-handler";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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

// Validate ObjectId helper
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && id.match(/^[0-9a-fA-F]{24}$/);
};


// ADD PRODUCT API
export const addProduct = asyncHandler(async (req, res) => {
  const body = req.body;

  if (!body.dishName || !body.category) {
    return res.status(400).json({
      success: false,
      message: "dishName & category are required",
    });
  }

  let categoryId = body.category.trim();

  // Validate ObjectId and check if category exists
  if (!isValidObjectId(categoryId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid category ID format",
    });
  }

  const categoryDoc = await Category.findById(categoryId);

  if (!categoryDoc) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  // Hybrid Discount Handling
  const price = toNum(body.price);
  const originalPrice = toNum(body.originalPrice);

  let discountPercent = null;

  if (body.discountPercent !== undefined && body.discountPercent !== null) {
    discountPercent = toNum(body.discountPercent);
  } else if (originalPrice && price && originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  // Create product payload
  const payload = {
    dishName: body.dishName.trim(),
    category: categoryId,
    volume: body.volume?.trim() || "1 Litre Pouch",
    availableQuantities: parseJSON(body.availableQuantities),
    attributes: parseJSON(body.attributes),
    price,
    originalPrice,
    discountPercent, // hybrid handling
    cost: toNum(body.cost),
    preparationTime: toNum(body.preparationTime),
    calories: toNum(body.calories),
    description: body.description || "",
    benefits: parseJSON(body.benefits),
    image: req.file ? `/uploads/${req.file.filename}` : null,
    availableForOrder:
      body.availableForOrder === "true" || body.availableForOrder === true,
    vegetarian: body.vegetarian === "true" || body.vegetarian === true,
    isVIP: body.isVIP === "true" || body.isVIP === true,
    stock: toNum(body.stock) || 0,
    addedBy: req.user._id,
  };

  const product = await Product.create(payload);
  await product.populate("category", "name displayName icon image");


  res.status(201).json({
    success: true,
    message: "Product added successfully",
    product,
    savings: product.savings, 
    profit: product.price - product.cost, 
  });
});
// Get All PRODUCTd API
export const getProducts = asyncHandler(async (req, res) => {
  const { search = "", category = "All", platform = "web" } = req.query;

  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  let query = {};

  // SEARCH FILTER

  if (search.trim()) {
    query.dishName = {
      $regex: search.trim(),
      $options: "i",
    };
  }

  // CATEGORY FILTER

  if (category !== "All") {
    const trimmedCat = category.trim();

    if (mongoose.Types.ObjectId.isValid(trimmedCat)) {
      query.category = trimmedCat;
    } else {
      const catDoc = await Category.findOne({
        name: { $regex: `^${trimmedCat}$`, $options: "i" },
      });

      if (catDoc) {
        query.category = catDoc._id;
      } else {
        return res.json({ success: true, total: 0, products: [] });
      }
    }
  }

  //GET PRODUCTS

  const products = await Product.find(query)
    .populate("category", "name displayName icon")
    .lean();

  if (products.length === 0) {
    return res.json({ success: true, total: 0, products: [] });
  }

  // **UPDATED** formatProduct to include image URL in availableQuantities
  const formatProduct = (p) => {
    let savings = null;

    if (p.originalPrice && p.originalPrice > p.price) {
      const amount = p.originalPrice - p.price;
      const percent = Math.round((amount / p.originalPrice) * 100);
      savings = { amount, percent };
    }

    const formattedQuantities = (p.availableQuantities || []).map((q) => ({
      ...q,
      image: q.image ? `${BASE_URL}${q.image}` : null, 
    }));

    return {
      id: p._id,
      name: p.dishName,
      category: p.category?.displayName || "Uncategorized",
      categoryName: p.category?.name || "",
      image: p.image ? `${BASE_URL}${p.image}` : null,
      price: p.price,
      originalPrice: p.originalPrice || null,
      discount: savings ? `${savings.percent}% OFF` : null,
      savings: savings ? `Saving ₹${savings.amount}` : null,
      volume: p.volume,
      availableQuantities: formattedQuantities, 
      attributes: p.attributes || [],
      benefits: p.benefits || [],
      inStock: p.stock > 0,
      isVIP: p.isVIP || false,
    };
  };

  // MOBILE FORMAT

  if (platform === "mobile") {
    const mobileProducts = products.map(formatProduct);

    return res.json({
      success: true,
      total: mobileProducts.length,
      products: mobileProducts,
    });
  }

  // WEB FORMAT

  const webProducts = products.map(formatProduct);

  return res.json({
    success: true,
    total: webProducts.length,
    products: webProducts,
  });
});

// GET SINGLE PRODUCT

export const getProductById = asyncHandler(async (req, res) => {
  const { platform = "web" } = req.query;
  const productId = req.params.id.trim();

  // Validate ObjectId
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
    });
  }

  const product = await Product.findById(productId).populate(
    "category",
    "name displayName icon"
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  // Calculate savings
  let savings = null;
  if (product.originalPrice && product.originalPrice > product.price) {
    const savingAmount = product.originalPrice - product.price;
    const savingPercent = Math.round(
      (savingAmount / product.originalPrice) * 100
    );
    savings = { amount: savingAmount.toFixed(2), percent: savingPercent };
  }

  // **NEW** formatting for availableQuantities
  const formattedQuantities = (product.availableQuantities || []).map((q) => ({
    ...q.toObject(),
    image: q.image ? `${BASE_URL}${q.image}` : null,
  }));

  // MOBILE RESPONSE
  if (platform === "mobile") {
    return res.json({
      success: true,
      platform: "mobile",
      product: {
        id: product._id,
        name: product.dishName,
        category: product.category?.displayName || "Uncategorized",
        volume: product.volume,
        availableQuantities: formattedQuantities, 
        attributes: product.attributes || [],
        price: product.price,
        originalPrice: product.originalPrice || null,
        discount: savings ? `${savings.percent}% OFF` : null,
        savings: savings ? `Saving ₹${savings.amount}` : null,
        image_url: product.image ? `${BASE_URL}${product.image}` : null,
        description: product.description || "",
        benefits: product.benefits || [],
        isVIP: product.isVIP || false,
        inStock: product.stock > 0,
        vegetarian: product.vegetarian,
        preparationTime: product.preparationTime || 5,
      },
    });
  }

  // WEB RESPONSE
  const productData = product.toObject({ virtuals: true });

  // **NEW** Override the default availableQuantities with BASE_URL applied
  productData.availableQuantities = formattedQuantities;

  if (!productData.savings) {
    productData.savings = savings;
  }

  res.json({
    success: true,
    platform: "web",
    product: productData,
  });
});

// UPDATE PRODUCT
export const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id.trim();

  // Validate ObjectId
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const body = req.body;

  // Validate category if being updated
  if (body.category && body.category !== product.category.toString()) {
    const categoryId = body.category.trim();

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
  }

  // Calculate discount
  let discountPercent = product.discountPercent;
  const newPrice = toNum(body.price);
  const newOriginalPrice = toNum(body.originalPrice);

  if (newOriginalPrice && newPrice) {
    if (newOriginalPrice > newPrice) {
      discountPercent = Math.round(
        ((newOriginalPrice - newPrice) / newOriginalPrice) * 100
      );
    } else {
      discountPercent = 0;
    }
  }

  // Update fields
  product.dishName = body.dishName?.trim() || product.dishName;
  product.category = body.category?.trim() || product.category;
  product.volume = body.volume?.trim() || product.volume;
  product.availableQuantities = body.availableQuantities
    ? parseJSON(body.availableQuantities)
    : product.availableQuantities;
  product.attributes = body.attributes
    ? parseJSON(body.attributes)
    : product.attributes;
  product.price = newPrice ?? product.price;
  product.originalPrice = newOriginalPrice ?? product.originalPrice;
  product.discountPercent = discountPercent;
  product.cost = toNum(body.cost) ?? product.cost;
  product.preparationTime = toNum(body.preparationTime) ?? product.preparationTime;
  product.calories = toNum(body.calories) ?? product.calories;
  product.description = body.description ?? product.description;
  product.benefits = body.benefits ? parseJSON(body.benefits) : product.benefits;
  product.availableForOrder =
    body.availableForOrder === "true"
      ? true
      : body.availableForOrder === "false"
      ? false
      : product.availableForOrder;
  product.vegetarian =
    body.vegetarian === "true"
      ? true
      : body.vegetarian === "false"
      ? false
      : product.vegetarian;
  product.isVIP =
    body.isVIP === "true"
      ? true
      : body.isVIP === "false"
      ? false
      : product.isVIP;
  product.stock = toNum(body.stock) ?? product.stock;

  // Handle image update
  if (req.file) {
    if (product.image) {
      const oldPath = path.join(
        process.cwd(),
        "uploads",
        path.basename(product.image)
      );
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    product.image = `/uploads/${req.file.filename}`;
  }

  await product.save();
  await product.populate("category", "name displayName icon");

  res.json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

// DELETE PRODUCT

export const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id.trim();

  // Validate ObjectId
  if (!isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID format",
    });
  }

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  // Remove image
  if (product.image) {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      path.basename(product.image)
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
});

// GET PRODUCTS GROUPED BY CATEGORY

export const getProductsGroupedByCategory = asyncHandler(async (req, res) => {
  const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

  const categories = await Category.find().sort({ sortOrder: 1 });

  const groupedProducts = await Promise.all(
    categories.map(async (category) => {
      const products = await Product.find({
        category: category._id,
        availableForOrder: true,
      })
        .select("-addedBy -createdAt -updatedAt")
        .lean();

      // **UPDATED** to include image URL in availableQuantities
      const productsWithSavings = products.map((product) => {
        let savings = null;
        if (
          product.originalPrice &&
          product.originalPrice > product.price
        ) {
          const savingAmount = product.originalPrice - product.price;
          const savingPercent = Math.round(
            (savingAmount / product.originalPrice) * 100
          );
          savings = { amount: savingAmount.toFixed(2), percent: savingPercent };
        }

        const formattedQuantities = (product.availableQuantities || []).map(
          (q) => ({
            ...q,
            image: q.image ? `${BASE_URL}${q.image}` : null, 
          })
        );

        return {
          ...product,
          savings,
          availableQuantities: formattedQuantities, 
        };
      });

      return {
        category: {
          _id: category._id,
          name: category.name,
          displayName: category.displayName,
          icon: category.icon,
        },
        products: productsWithSavings,
      };
    })
  );

  const filteredGroups = groupedProducts.filter((g) => g.products.length > 0);

  res.json({
    success: true,
    data: filteredGroups,
  });
});