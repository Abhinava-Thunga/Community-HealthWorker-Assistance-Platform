import express from "express";

import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  searchPatients,
} from "../controllers/patientController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// CREATE PATIENT
// ==========================================

router.post(
  "/",
  protect,
  authorize("WORKER", "ADMIN", "SUPER_ADMIN"),
  createPatient
);

// ==========================================
// SEARCH PATIENTS
// IMPORTANT: Must come before /:id
// ==========================================

router.get(
  "/search",
  protect,
  authorize("WORKER", "ADMIN", "SUPER_ADMIN"),
  searchPatients
);

// ==========================================
// GET ALL PATIENTS
// ==========================================

router.get(
  "/",
  protect,
  authorize("WORKER", "ADMIN", "SUPER_ADMIN"),
  getPatients
);

// ==========================================
// GET PATIENT BY ID
// ==========================================

router.get(
  "/:id",
  protect,
  authorize("WORKER", "ADMIN", "SUPER_ADMIN"),
  getPatientById
);

// ==========================================
// UPDATE PATIENT
// ==========================================

router.put(
  "/:id",
  protect,
  authorize("WORKER", "ADMIN", "SUPER_ADMIN"),
  updatePatient
);

export default router;