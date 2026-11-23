import express from "express";

import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  searchPatients,
  deletePatient,
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
  authorize("WORKER", "ADMIN"),
  createPatient
);

// ==========================================
// SEARCH PATIENTS
// IMPORTANT: Must come before /:id
// ==========================================

router.get(
  "/search",
  protect,
  authorize("WORKER", "ADMIN"),
  searchPatients
);

// ==========================================
// GET ALL PATIENTS
// ==========================================

router.get(
  "/",
  protect,
  authorize("WORKER", "ADMIN"),
  getPatients
);

// ==========================================
// GET PATIENT BY ID
// ==========================================

router.get(
  "/:id",
  protect,
  authorize("WORKER", "ADMIN"),
  getPatientById
);

// ==========================================
// UPDATE PATIENT
// ==========================================

router.put(
  "/:id",
  protect,
  authorize("WORKER", "ADMIN"),
  updatePatient
);

// ==========================================
// DELETE PATIENT
// ==========================================

router.delete(
  "/:id",
  protect,
  authorize("WORKER", "ADMIN"),
  deletePatient
);

export default router;