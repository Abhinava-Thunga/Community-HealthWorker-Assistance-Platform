import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFORMATION
    // =========================

    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    age: {
      type: Number,
      required: [true, "Age is required"],
      min: 0,
      max: 120,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: [true, "Gender is required"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    // =========================
    // ADDRESS
    // =========================

    address: {
      type: String,
      default: "",
      trim: true,
    },

    village: {
      type: String,
      default: "",
      trim: true,
    },

    district: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // EMERGENCY CONTACT
    // =========================

    emergencyContactName: {
      type: String,
      default: "",
      trim: true,
    },

    emergencyContactPhone: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // HEALTH INFORMATION
    // =========================

    bloodGroup: {
      type: String,
      enum: [
        "",
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ],
      default: "",
    },

    allergies: {
      type: String,
      default: "",
      trim: true,
    },

    existingConditions: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // REGISTERED BY
    // =========================

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // STATUS
    // =========================

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;