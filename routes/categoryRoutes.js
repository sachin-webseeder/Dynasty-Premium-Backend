import express from "express";
import {
  getAllCategories,
  getProductsByCategory,
  getProductsGroupedByCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";

import upload from "../config/multer.js";   

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// PUBLIC
router.get("/", getAllCategories);
router.get("/with-products", getProductsGroupedByCategory);
router.get("/:categoryId/products", getProductsByCategory);

// ADMIN
router.post(
  "/",
  protect,
  authorize("SuperAdmin", "Admin"),
  upload.single("image"),       
  createCategory
);

router.put(
  "/:id",
  protect,
  authorize("SuperAdmin", "Admin"),
  upload.single("image"),        
  updateCategory
);

router.delete("/:id", protect, authorize("SuperAdmin", "Admin"), deleteCategory);

export default router;
