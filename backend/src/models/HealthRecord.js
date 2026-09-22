import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    dosage: { type: String, trim: true, default: "" },
    frequency: { type: String, trim: true, default: "" },
    duration: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String, trim: true, default: "" }, // e.g. "120/80"
    heartRate: { type: Number, default: null }, // bpm
    temperature: { type: Number, default: null }, // °F
    spO2: { type: Number, default: null }, // %
    respiratoryRate: { type: Number, default: null }, // breaths/min
    weight: { type: Number, default: null }, // kg
    height: { type: Number, default: null }, // cm
    bloodGlucose: { type: Number, default: null }, // mg/dL
  },
  { _id: false }
);

const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient reference is required"],
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recorded by health worker reference is required"],
    },

    recordDate: {
      type: Date,
      default: Date.now,
    },

    recordType: {
      type: String,
      enum: [
        "GENERAL_CHECKUP",
        "VITALS",
        "IMMUNIZATION",
        "DIAGNOSIS",
        "PRESCRIPTION",
        "ANTENATAL_CARE",
        "LAB_TEST",
      ],
      default: "GENERAL_CHECKUP",
    },

    vitals: {
      type: vitalsSchema,
      default: () => ({}),
    },

    symptoms: {
      type: String,
      trim: true,
      default: "",
    },

    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },

    treatmentPlan: {
      type: String,
      trim: true,
      default: "",
    },

    medications: [medicationSchema],

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const HealthRecord = mongoose.model("HealthRecord", healthRecordSchema);

export default HealthRecord;
