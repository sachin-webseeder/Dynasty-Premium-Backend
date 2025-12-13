import express from "express";
import upload from "../config/multer.js";
import { protect, authorize } from "../middleware/auth.js";

import {
  addVariant,
  updateVariant,
  deleteVariant,
} from "../controllers/productVariantController.js";

const router = express.Router();

/**
 * VARIANT ROUTES (NO EXISTING ROUTE TOUCHED)
 */

// ADD VARIANT
router.post(
  "/:productId/variant",
  protect,
  authorize("SuperAdmin", "Admin"),
  upload.single("image"),
  addVariant
);

// UPDATE VARIANT
router.put(
  "/:productId/variant/:variantId",
  protect,
  authorize("SuperAdmin", "Admin"),
  upload.single("image"),
  updateVariant
);

// DELETE VARIANT
router.delete(
  "/:productId/variant/:variantId",
  protect,
  authorize("SuperAdmin", "Admin"),
  deleteVariant
);

export default router;
