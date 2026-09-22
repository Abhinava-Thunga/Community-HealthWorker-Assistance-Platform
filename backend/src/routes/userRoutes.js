import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  getCurrentUser,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

router.get(
  "/me",
  protect,
  getCurrentUser
);

router.put(
  "/change-password",
  protect,
  changePassword
);

export default router;
