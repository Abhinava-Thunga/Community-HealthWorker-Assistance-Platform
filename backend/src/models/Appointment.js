import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient reference is required"],
    },

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Health worker reference is required"],
    },

    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },

    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      trim: true,
      default: "10:00 AM",
    },

    purpose: {
      type: String,
      required: [true, "Purpose of visit is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "MISSED"],
      default: "SCHEDULED",
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },

    location: {
      type: String,
      default: "Community Health Center",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    followUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
