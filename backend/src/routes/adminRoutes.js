import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { adminDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  adminDashboard
);

export default router;