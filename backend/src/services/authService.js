import User from "../models/user.js";
import {
  validateVerificationToken,
  deleteVerificationToken,
} from "./verificationTokenService.js";
import generateJWT from "../utils/generateJWT.js";

export const registerUser = async ({
  fullName,
  email,
  phone,
  password,
  verificationToken,
}) => {

  await validateVerificationToken(
    email,
    verificationToken
  );

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    role: "WORKER",
    isEmailVerified: true,
    isApproved: false,
    status: "INACTIVE",
  });

  await deleteVerificationToken(email);

  return user;
};

export const loginUser = async ({
  email,
  password,
}) => {

  const user = await User.findOne({ email });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isMatch =
    await user.comparePassword(password);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check if account is approved by admin
  if (!user.isApproved) {
    const error = new Error(
      "Your account is pending administrator approval. Please wait for an administrator to approve your account."
    );
    error.statusCode = 403;
    throw error;
  }

  // Check if account status is active
  if (user.status !== "ACTIVE") {
    const error = new Error(
      "Your account is inactive. Please contact the administrator."
    );
    error.statusCode = 403;
    throw error;
  }

  const token = generateJWT(user);

  return {
    user,
    token,
  };
};