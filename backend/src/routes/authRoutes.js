import express from "express";

import {
  sendOTPController,
  verifyOTPController,
  registerController,
  loginController,
} from "../controllers/authController.js";

const router = express.Router();

// Send OTP
router.post("/send-otp", sendOTPController);

// Verify OTP
router.post("/verify-otp", verifyOTPController);

// Register
router.post("/register", registerController);

// Login
router.post("/login", loginController);

export default router;