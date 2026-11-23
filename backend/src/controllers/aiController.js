import AiConversation from "../models/AiConversation.js";
import Patient from "../models/Patient.js";
import HealthRecord from "../models/HealthRecord.js";
import { generateAiChatResponse } from "../services/aiService.js";

/**
 * Send a message to AI Health Assistant
 * POST /api/ai/chat
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationId, patientId, customVitals } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    let patientContext = null;

    // Look up patient if provided
    if (patientId) {
      try {
        const patient = await Patient.findById(patientId);
        if (patient) {
          patientContext = {
            id: patient._id,
            fullName: patient.fullName,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies,
            existingConditions: patient.existingConditions,
            vitals: customVitals || {},
          };

          // If no custom vitals supplied, fetch latest health record vitals
          if (!customVitals || Object.keys(customVitals).length === 0) {
            const latestRecord = await HealthRecord.findOne({ patient: patient._id }).sort({ recordDate: -1, createdAt: -1 });
            if (latestRecord && latestRecord.vitals) {
              patientContext.vitals = latestRecord.vitals;
              patientContext.latestDiagnosis = latestRecord.diagnosis;
              patientContext.latestSymptoms = latestRecord.symptoms;
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve patient context:", err.message);
      }
    } else if (customVitals) {
      patientContext = { vitals: customVitals };
    }

    // Retrieve or initialize conversation
    let conversation;
    if (conversationId) {
      conversation = await AiConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      // Generate a short title from the first 5-6 words of message
      const generatedTitle = message.trim().split(/\s+/).slice(0, 6).join(" ") || "Clinical Consultation";
      conversation = new AiConversation({
        user: req.user._id,
        patient: patientId || null,
        title: generatedTitle,
        messages: [],
      });
    }

    // Append user message
    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    // Call AI Service
    const aiResult = await generateAiChatResponse({
      message,
      conversationHistory: conversation.messages,
      patientContext,
    });

    // Append assistant message
    const assistantMsg = {
      role: "assistant",
      content: aiResult.response,
      triageLevel: aiResult.triageLevel,
      patientContextSummary: patientContext ? `${patientContext.fullName || "Patient"} (${patientContext.age || "?"}y, ${patientContext.gender || "?"})` : "",
      timestamp: new Date(),
    };

    conversation.messages.push(assistantMsg);

    // If conversation title was default and patient is attached, improve title
    if (patientContext?.fullName && conversation.title === "Clinical Consultation") {
      conversation.title = `Consultation: ${patientContext.fullName}`;
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      conversationId: conversation._id,
      title: conversation.title,
      message: assistantMsg,
      isOfflineEngine: aiResult.isOfflineEngine,
      model: aiResult.model,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing AI consultation",
      error: error.message,
    });
  }
};

/**
 * Get all conversations for current user
 * GET /api/ai/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const conversations = await AiConversation.find({ user: req.user._id })
      .populate("patient", "fullName age gender bloodGroup")
      .select("title patient createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .limit(30);

    const summaries = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      patient: c.patient,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.length > 0 ? c.messages[c.messages.length - 1].content.slice(0, 80) + "..." : "",
      lastTriage: c.messages?.length > 0 ? c.messages[c.messages.length - 1].triageLevel : "INFO",
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    res.status(200).json({
      success: true,
      conversations: summaries,
    });
  } catch (error) {
    console.error("Get AI Conversations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve AI conversations",
      error: error.message,
    });
  }
};

/**
 * Get single conversation with full message thread
 * GET /api/ai/conversations/:id
 */
export const getConversationById = async (req, res) => {
  try {
    const conversation = await AiConversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("patient", "fullName age gender bloodGroup phone address village allergies existingConditions");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversation details",
      error: error.message,
    });
  }
};

/**
 * Delete a conversation
 * DELETE /api/ai/conversations/:id
 */
export const deleteConversation = async (req, res) => {
  try {
    const deleted = await AiConversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
      error: error.message,
    });
  }
};

/**
 * Analyze patient vitals with AI
 * POST /api/ai/analyze-vitals/:patientId
 */
export const analyzePatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const latestRecord = await HealthRecord.findOne({ patient: patient._id }).sort({ recordDate: -1, createdAt: -1 });

    const vitals = latestRecord?.vitals || {};
    const patientContext = {
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      existingConditions: patient.existingConditions,
      vitals,
      latestDiagnosis: latestRecord?.diagnosis,
      latestSymptoms: latestRecord?.symptoms,
    };

    const prompt = `Please conduct a clinical vitals triage analysis for patient ${patient.fullName} (${patient.age} yrs, ${patient.gender}). Blood Pressure: ${vitals.bloodPressure || "Not recorded"}, Heart Rate: ${vitals.heartRate ? vitals.heartRate + " bpm" : "Not recorded"}, SpO2: ${vitals.spO2 ? vitals.spO2 + "%" : "Not recorded"}, Temp: ${vitals.temperature ? vitals.temperature + "°F" : "Not recorded"}, Blood Glucose: ${vitals.bloodGlucose ? vitals.bloodGlucose + " mg/dL" : "Not recorded"}. Identify any urgent red flags, next clinical monitoring steps, and primary healthcare actions.`;

    const aiResult = await generateAiChatResponse({
      message: prompt,
      patientContext,
    });

    res.status(200).json({
      success: true,
      patient: {
        id: patient._id,
        name: patient.fullName,
        age: patient.age,
        gender: patient.gender,
      },
      vitals,
      triageLevel: aiResult.triageLevel,
      analysis: aiResult.response,
      isOfflineEngine: aiResult.isOfflineEngine,
    });
  } catch (error) {
    console.error("Analyze Vitals Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze patient vitals",
      error: error.message,
    });
  }
};
