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
  workerId,
  role = "WORKER",
}) => {
  await validateVerificationToken(
    email,
    verificationToken
  );

  // Validate Worker ID presence
  if (!workerId || !String(workerId).trim()) {
    throw new Error("ASHA / Worker ID is required");
  }

  const normalizedWorkerId = String(workerId).trim().toUpperCase();

  // Check duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("An account with this email is already registered");
  }

  // Check duplicate workerId
  const existingWorker = await User.findOne({ workerId: normalizedWorkerId });
  if (existingWorker) {
    throw new Error(`Worker ID / ASHA ID "${normalizedWorkerId}" is already registered. Please check your ID.`);
  }

  // Assign user-selected role (defaults to WORKER if not specified)
  const assignedRole = String(role).toUpperCase() === "ADMIN" ? "ADMIN" : "WORKER";

  // Account is created with the requested role, pending approval (isApproved: false, status: "INACTIVE")
  // For Admin: approve by setting isApproved: true, status: "ACTIVE" in MongoDB Atlas
  // For Worker: approved either via Admin Panel by an active Admin or via MongoDB Atlas
  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    workerId: normalizedWorkerId,
    role: assignedRole,
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

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  // Check if account is approved by admin (or updated in MongoDB Atlas for Admin)
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
