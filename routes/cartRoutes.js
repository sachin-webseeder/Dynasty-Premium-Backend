// routes/cartRoutes.js
import express from "express";
import {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCart,
  clearCart
} from "../controllers/cartController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("Customer"));

router.post("/add", addToCart);
router.post("/update", updateCartQuantity);
router.post("/remove", removeFromCart);
router.get("/", getCart);
router.post("/clear", clearCart);

export default router;