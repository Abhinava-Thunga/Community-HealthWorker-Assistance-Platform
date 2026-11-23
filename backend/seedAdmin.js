import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.js";

dotenv.config();

/**
 * CLI Tool to Create or Promote an Admin User
 * Usage:
 *   node seedAdmin.js <email> [password] [fullName]
 *
 * Example:
 *   node seedAdmin.js admin@communityhealth.org Admin@2026 "Health Officer Admin"
 */
const seedAdmin = async () => {
  const args = process.argv.slice(2);
  const email = (args[0] || "admin@communityhealth.org").trim().toLowerCase();
  const password = args[1] || "Admin@2026";
  const fullName = args[2] || "District Health Administrator";
  const phone = "9876543210";

  console.log("==========================================");
  console.log("🏥 CHW Platform - Admin Provisioning Tool");
  console.log("==========================================");
  console.log("Target Email:", email);

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected.");

    let user = await User.findOne({ email });

    if (user) {
      console.log(`User found: ${user.fullName} (${user.role})`);
      user.role = "ADMIN";
      user.isApproved = true;
      user.isEmailVerified = true;
      user.status = "ACTIVE";
      if (!user.workerId) {
        user.workerId = "ADMIN-" + Math.floor(1000 + Math.random() * 9000);
      }
      if (args[1]) {
        user.password = password; // Will be hashed by pre-save hook
      }
      await user.save();
      console.log("✅ User successfully promoted to ADMIN and activated in MongoDB!");
    } else {
      console.log("User not found. Creating brand-new ADMIN user...");
      user = await User.create({
        fullName,
        email,
        phone,
        workerId: "ADMIN-001",
        password,
        role: "ADMIN",
        isApproved: true,
        isEmailVerified: true,
        status: "ACTIVE",
        organization: "District Public Health Division",
        district: "Primary Health District",
      });
      console.log("✅ ADMIN account created successfully!");
    }

    console.log("------------------------------------------");
    console.log("Email:   ", email);
    console.log("Password:", password);
    console.log("Role:    ", user.role);
    console.log("Status:  ", user.status);
    console.log("Approved:", user.isApproved);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Seed Admin Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();
