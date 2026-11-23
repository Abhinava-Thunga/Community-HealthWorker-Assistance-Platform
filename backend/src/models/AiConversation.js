import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    triageLevel: {
      type: String,
      enum: ["ROUTINE", "MODERATE", "URGENT", "INFO"],
      default: "INFO",
    },
    patientContextSummary: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
    title: {
      type: String,
      default: "Clinical Consultation",
      trim: true,
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

const AiConversation = mongoose.model("AiConversation", aiConversationSchema);

export default AiConversation;
