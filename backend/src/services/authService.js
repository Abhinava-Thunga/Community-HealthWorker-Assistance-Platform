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
    isApproved: true,
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
    throw new Error("Invalid email or password");
  }

  const isMatch =
    await user.comparePassword(password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateJWT(user);

  return {
    user,
    token,
  };

};