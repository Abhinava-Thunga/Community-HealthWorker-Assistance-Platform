import OTP from "../models/OTP.js";
import generateOTP from "../utils/generateOTP.js";
import sendEmail from "./emailService.js";

/**
 * Normalize email
 */
const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/**
 * Normalize OTP
 */
const normalizeOTP = (otp) => {
  return String(otp || "")
    .trim()
    .replace(/\s/g, "");
};

/**
 * Generate and Send OTP
 */
export const sendOTP = async (
  email,
  purpose = "REGISTER"
) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  // ----------------------------------------------------------
  // Delete any previous OTPs for this email and purpose
  // ----------------------------------------------------------

  await OTP.deleteMany({
    email: normalizedEmail,
    purpose,
  });

  // ----------------------------------------------------------
  // Generate OTP
  // ----------------------------------------------------------

  const generatedOTP = generateOTP();

  // Always store OTP as a string
  const otp = normalizeOTP(generatedOTP);

  if (!otp) {
    throw new Error("Unable to generate OTP");
  }

  // ----------------------------------------------------------
  // OTP expires after 5 minutes
  // ----------------------------------------------------------

  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // ----------------------------------------------------------
  // Save OTP to MongoDB
  // ----------------------------------------------------------

  await OTP.create({
    email: normalizedEmail,
    otp: otp,
    purpose,
    expiresAt,
  });

  console.log(`[OTP Service] Generated ${purpose} OTP for ${normalizedEmail}: ${otp}`);

  // ----------------------------------------------------------
  // Send OTP email
  // ----------------------------------------------------------

  await sendEmail(
    normalizedEmail,
    "Community Health Worker Assistance Platform - Email Verification",
    `
      <div style="
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 600px;
        margin: auto;
        padding: 20px;
      ">

        <h2 style="color:#0d6efd;">
          Community Health Worker Assistance Platform
        </h2>

        <p>Hello,</p>

        <p>
          Your One-Time Password (OTP) for email verification is:
        </p>

        <div style="
          background:#f4f7fb;
          padding:20px;
          text-align:center;
          border-radius:10px;
          margin:20px 0;
        ">

          <h1 style="
            letter-spacing:8px;
            color:#0d6efd;
            margin:0;
          ">
            ${otp}
          </h1>

        </div>

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

  const normalizedEmail = normalizeEmail(email);
  const normalizedOTP = normalizeOTP(otp);

  if (!normalizedEmail || !normalizedOTP) {
    throw new Error("Email and OTP are required");
  }

  // ----------------------------------------------------------
  // IMPORTANT:
  // Get the latest OTP for this email first.
  // ----------------------------------------------------------

  const otpDocument = await OTP.findOne({
    email: normalizedEmail,
    purpose,
  })
    .sort({ createdAt: -1 });

  // No OTP found
  if (!otpDocument) {
    throw new Error("Invalid OTP");
  }

  // ----------------------------------------------------------
  // Check expiration
  // ----------------------------------------------------------

  if (
    !otpDocument.expiresAt ||
    otpDocument.expiresAt.getTime() < Date.now()
  ) {
    await OTP.deleteMany({
      email: normalizedEmail,
      purpose,
    });

    throw new Error("Invalid or expired OTP. Please request a new OTP.");
  }

  // ----------------------------------------------------------
  // Compare OTP as strings
  // ----------------------------------------------------------

  const savedOTP = normalizeOTP(
    otpDocument.otp
  );

  if (savedOTP !== normalizedOTP) {
    throw new Error("Invalid OTP");
  }

  // ----------------------------------------------------------
  // OTP is correct
  // Delete it immediately from MongoDB so it cannot be reused
  // ----------------------------------------------------------

  await OTP.deleteMany({
    email: normalizedEmail,
    purpose,
  });

  return true;
};