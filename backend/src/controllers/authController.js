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

// ======================================================
// SEND OTP
// ======================================================
export const sendOTPController = async (req, res) => {
  try {
    let { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Send REGISTER OTP
    await sendOTP(email, "REGISTER");

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      email,
    });

  } catch (error) {
    console.error("Send OTP Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to send OTP",
    });
  }
};


// ======================================================
// VERIFY OTP
// ======================================================
export const verifyOTPController = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // Validate
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Normalize values
    email = email.trim().toLowerCase();
    otp = String(otp).trim();

    // OTP must be exactly 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit number",
      });
    }

    console.log("========== OTP VERIFICATION ==========");
    console.log("Email:", email);
    console.log("OTP:", otp);
    console.log("Purpose:", "REGISTER");

    // Verify OTP
    await verifyOTP(
      email,
      otp,
      "REGISTER"
    );

    // Create verification token
    const verificationToken =
      await createVerificationToken(email);

    console.log("OTP verification successful");

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      verificationToken,
    });

  } catch (error) {
    console.error(
      "OTP Verification Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message || "Invalid OTP",
    });
  }
};


// ======================================================
// REGISTER
// ======================================================
export const registerController = async (
  req,
  res
) => {
  try {
    let {
      fullName,
      email,
      phone,
      password,
      verificationToken,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !verificationToken
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required",
      });
    }

    // Normalize data
    fullName = fullName.trim();
    email = email.trim().toLowerCase();
    phone = phone.trim();

    // Register user
    const user = await registerUser({
      fullName,
      email,
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
    console.error(
      "Registration Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Registration failed",
    });
  }
};


// ======================================================
// LOGIN
// ======================================================
export const loginController = async (
  req,
  res
) => {
  try {
    let {
      email,
      password,
    } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    // Login
    const result = await loginUser({
      email,
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
    console.error(
      "Login Error:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Login failed",
    });
  }
};