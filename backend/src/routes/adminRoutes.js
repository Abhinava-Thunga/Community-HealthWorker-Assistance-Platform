import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  adminDashboard,
  getAdminStats,
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require login and ADMIN role
router.use(protect);
router.use(authorize("ADMIN"));

router.get("/dashboard", adminDashboard);
router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.put("/users/:id/approve", approveUser);
router.put("/users/:id/reject", rejectUser);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

export default router;
