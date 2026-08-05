import {
  sendOTP,
  verifyOTP,
} from "../services/otpService.js";

import {
  createVerificationToken,
} from "../services/verificationTokenService.js";

import {
  registerUser,
  loginUser,
} from "../services/authService.js";

// ==============================
// Send OTP
// ==============================
export const sendOTPController = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await sendOTP(email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ==============================
// Verify OTP
// ==============================
export const verifyOTPController = async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (!email || !otp) {

      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });

    }

    await verifyOTP(
      email.toLowerCase(),
      otp
    );

    const verificationToken =
      await createVerificationToken(
        email.toLowerCase()
      );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      verificationToken,
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

// ==============================
// Register
// ==============================
export const registerController = async (
  req,
  res
) => {

  try {

    const {
      fullName,
      email,
      phone,
      password,
      verificationToken,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !verificationToken
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });

    }

    const user = await registerUser({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      verificationToken,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};

// ==============================
// Login
// ==============================
export const loginController = async (
  req,
  res
) => {

  try {

    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {

      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });

    }

    const result = await loginUser({
      email: email.toLowerCase(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: result.token,
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
      },
    });

  } catch (error) {

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  }

};