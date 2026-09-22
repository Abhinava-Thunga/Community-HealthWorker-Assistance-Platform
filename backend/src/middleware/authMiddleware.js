import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {

  console.log("======================================");
  console.log("AUTH MIDDLEWARE");
  console.log("URL:", req.originalUrl);
  console.log("Method:", req.method);
  console.log("Authorization Header:", req.headers.authorization);
  console.log("======================================");

  try {

    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find User
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Attach user to request
    req.user = user;

    next();

  } catch (error) {

    console.error("JWT Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });

  }

};