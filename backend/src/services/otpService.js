import OTP from "../models/OTP.js";
import generateOTP from "../utils/generateOTP.js";
import sendEmail from "./emailService.js";

/**
 * Generate and Send OTP
 */
export const sendOTP = async (
  email,
  purpose = "REGISTER"
) => {

  // Delete old OTPs
  await OTP.deleteMany({
    email,
    purpose,
  });

  // Generate new OTP
  const otp = generateOTP();

  // OTP expires in 5 minutes
  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Save OTP
  await OTP.create({
    email,
    otp,
    purpose,
    expiresAt,
  });

  // Send Email
  await sendEmail(
    email,
    "Community Health Worker Assistance Platform - Email Verification",
    `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2 style="color:#0d6efd;">
          Community Health Worker Assistance Platform
        </h2>

        <p>Hello,</p>

        <p>Your One-Time Password (OTP) is:</p>

        <h1 style="
          letter-spacing:6px;
          color:#0d6efd;
        ">
          ${otp}
        </h1>

        <p>
          This OTP is valid for
          <strong>5 minutes</strong>.
        </p>

        <p>
          Please do not share this OTP with anyone.
        </p>

        <br>

        <p>
          Regards,
        </p>

        <strong>
          Community Health Worker Assistance Platform
        </strong>
      </div>
    `
  );

  return true;

};

/**
 * Verify OTP
 */
export const verifyOTP = async (
  email,
  otp,
  purpose = "REGISTER"
) => {

  const otpDocument = await OTP.findOne({
    email,
    otp,
    purpose,
  });

  if (!otpDocument) {
    throw new Error("Invalid OTP");
  }

  if (otpDocument.expiresAt < new Date()) {

    await OTP.deleteOne({
      _id: otpDocument._id,
    });

    throw new Error("OTP Expired");
  }

  // Delete used OTP
  await OTP.deleteOne({
    _id: otpDocument._id,
  });

  return true;

};