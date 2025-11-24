// controllers/categoryController.js
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import asyncHandler from "express-async-handler";

//Get all categories with product count
export const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    sortOrder: 1,
  });

  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const productCount = await Product.countDocuments({
        category: cat._id,
        availableForOrder: true,
      });

      return {
        _id: cat._id,
        name: cat.name,
        displayName: cat.displayName,
        icon: cat.icon,
        image: cat.image,   // ✅ FIX: image added
        productCount,
      };
    })
  );

  res.json({
    success: true,
    categories: categoriesWithCount,
  });
});

//Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const products = await Product.find({ category: categoryId });

    res.status(200).json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        displayName: category.displayName,
        image: category.image,  // ✅ FIX
      },
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get products grouped by category

export const getProductsGroupedByCategory = async (req, res) => {
  try {
    const categories = await Category.find().lean();

    const data = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ category: cat._id }).lean();

        return {
          category: {
            _id: cat._id,
            name: cat.name,
            displayName: cat.displayName,
            icon: cat.icon,
            image: cat.image,  // already correct
          },
          products,
        };
      })
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Get all categories with products
export const getAllCategoriesWithProducts = async (req, res) => {
  try {
    const categories = await Category.find().lean();

    const result = await Promise.all(
      categories.map(async (cat) => {
        const products = await Product.find({ category: cat._id });

        return {
          ...cat, // already includes image
          products,
        };
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//Create new category (Admin)

export const createCategory = async (req, res) => {
  try {
    const { name, displayName, icon, description, sortOrder } = req.body;

    const category = new Category({
      name,
      displayName,
      icon,
      description,
      sortOrder,
      image: req.file ? `/uploads/categories/${req.file.filename}` : null, // VALID
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Update category
export const updateCategory = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/categories/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Delete category
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const productCount = await Product.countDocuments({
    category: category._id,
  });

  if (productCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete category with ${productCount} products. Delete products first.`
    );
  }

  await category.deleteOne();

  res.json({ success: true, message: "Category deleted successfully" });
});
