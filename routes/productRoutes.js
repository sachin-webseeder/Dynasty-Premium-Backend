// routes/productRoutes.js
import express from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsGroupedByCategory
} from "../controllers/productController.js";
import upload from "../config/multer.js";
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();


//PUBLIC ROUTES
  // GET ALL PRODUCTS (with filters)
  router.get("/", getProducts);

  // GET PRODUCTS GROUPED BY CATEGORY 
  router.get("/grouped", getProductsGroupedByCategory);

  // GET SINGLE PRODUCT
  router.get("/product/:id", getProductById);


//ADMIN ROUTES (Protected)

  // ADD PRODUCT
  router.post(
    "/add-product", 
    protect, 
    authorize('SuperAdmin', 'Admin'), 
    upload.single("image"), 
    addProduct
  );

  // UPDATE PRODUCT
  router.put(
    "/update-product/:id", 
    protect, 
    authorize('SuperAdmin', 'Admin'), 
    upload.single("image"), 
    updateProduct
  );

  // DELETE PRODUCT
  router.delete(
    "/delete-product/:id", 
    protect, 
    authorize('SuperAdmin', 'Admin'), 
    deleteProduct
  );

export default router;