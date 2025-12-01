// routes/userRoutes.js
import express from "express";
import {
  getAllPanelUsers,
  createPanelUser,
  updatePanelUser,
  deletePanelUser
} from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("Admin"));  // Only Admin can access all these

router.get("/panel-users", getAllPanelUsers);
router.post("/panel-users", createPanelUser);
router.put("/panel-users/:id", updatePanelUser);
router.delete("/panel-users/:id", deletePanelUser);

export default router;