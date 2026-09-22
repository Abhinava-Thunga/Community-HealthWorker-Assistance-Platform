import express from "express";
import {
  createHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
} from "../controllers/healthRecordController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("WORKER", "ADMIN", "SUPER_ADMIN"));

router.post("/", createHealthRecord);
router.get("/", getHealthRecords);
router.get("/:id", getHealthRecordById);
router.put("/:id", updateHealthRecord);
router.delete("/:id", deleteHealthRecord);

export default router;
