// routes/orderRoutes.js
import express from "express";
import {
  placeOrder,
  getMyOrders,
  getOrderDetail,
  getAllOrders,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Customer Routes
router.post("/place", protect, authorize("Customer"), placeOrder);
router.get("/my", protect, authorize("Customer"), getMyOrders);
router.get("/my/:id", protect, authorize("Customer"), getOrderDetail);

// Admin Routes
router.get("/all", protect, authorize("Admin"), getAllOrders);
router.put("/status/:id", protect, authorize("Admin"), updateOrderStatus);

export default router;