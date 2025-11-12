// routes/productRoutes.js
import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import upload from "../config/multer.js";
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ADD PRODUCT
router.post("/add-product", protect, authorize('SuperAdmin', 'Admin'), upload.single("image"), addProduct);

// GET ALL PRODUCTS
router.get("/", protect, getProducts);

// GET SINGLE PRODUCT
router.get("/product/:id", protect, getProductById);

// UPDATE PRODUCT
router.put("/update-product/:id", protect, authorize('SuperAdmin', 'Admin'), upload.single("image"), updateProduct);

// DELETE PRODUCT
router.delete("/delete-product/:id", protect, authorize('SuperAdmin', 'Admin'), deleteProduct);

export default router;