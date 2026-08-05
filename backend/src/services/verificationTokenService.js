import VerificationToken from "../models/VerificationToken.js";
import generateVerificationToken from "../utils/generateVerificationToken.js";

export const createVerificationToken = async (email) => {

  // Remove old tokens
  await VerificationToken.deleteMany({ email });

  const token = generateVerificationToken();

  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await VerificationToken.create({
    email,
    token,
    expiresAt,
  });

  return token;
};

export const validateVerificationToken = async (
  email,
  token
) => {

  const verification =
    await VerificationToken.findOne({
      email,
      token,
    });

  if (!verification) {
    throw new Error("Invalid verification token");
  }

  if (verification.expiresAt < new Date()) {

    await VerificationToken.deleteOne({
      _id: verification._id,
    });

    throw new Error("Verification token expired");
  }

  return verification;
};

export const deleteVerificationToken = async (
  email
) => {

  await VerificationToken.deleteMany({
    email,
  });

};