// routes/membershipRoutes.js
import express from "express";
import {
  getAllPlans,
  getPlanDetails,
  purchasePlan,
  razorpayWebhook,
  createPlan,
  updatePlan,
  initializeWalletTopUp,
  getWalletBalance
} from "../controllers/membershipController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/plans", protect, getAllPlans);
router.get("/plan/:id", protect, getPlanDetails);
router.post("/purchase", protect, purchasePlan);
router.post("/webhook/razorpay", razorpayWebhook); // No auth
router.post("/wallet/topup", protect, initializeWalletTopUp); //Customer
router.get("/wallet/balance", protect, getWalletBalance);

// Admin Only
router.post("/admin/plans", protect, authorize("Admin"), createPlan);
router.put("/admin/plans/:id", protect, authorize("Admin"), updatePlan);

export default router;