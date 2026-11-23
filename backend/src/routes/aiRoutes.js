import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  chat,
  getConversations,
  getConversationById,
  deleteConversation,
  analyzePatientVitals,
} from "../controllers/aiController.js";

const router = express.Router();

// All AI assistant routes require authentication
router.use(protect);

router.post("/chat", chat);
router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversationById);
router.delete("/conversations/:id", deleteConversation);
router.post("/analyze-vitals/:patientId", analyzePatientVitals);

export default router;
