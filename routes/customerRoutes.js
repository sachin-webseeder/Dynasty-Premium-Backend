// routes/customerRoutes.js
import express from "express";
import { getCustomerData, toggleCustomer, updateCustomer } from "../controllers/customerController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);


router.get("/", getCustomerData);
router.patch("/toggle/:id", toggleCustomer);
router.put("/update", updateCustomer);        // Customer updates self
router.put("/update/:id", updateCustomer);    // Admin updates any

export default router;