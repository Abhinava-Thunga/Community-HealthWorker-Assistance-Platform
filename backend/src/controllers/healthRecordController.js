import mongoose from "mongoose";
import HealthRecord from "../models/HealthRecord.js";
import Patient from "../models/Patient.js";

// ==========================================
// CREATE HEALTH RECORD
// ==========================================
export const createHealthRecord = async (req, res) => {
  try {
    const {
      patientId,
      recordType,
      vitals,
      symptoms,
      diagnosis,
      treatmentPlan,
      medications,
      notes,
      recordDate,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID format",
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const record = await HealthRecord.create({
      patient: patientId,
      recordedBy: req.user._id,
      recordType: recordType || "GENERAL_CHECKUP",
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      vitals: vitals || {},
      symptoms: symptoms || "",
      diagnosis: diagnosis || "",
      treatmentPlan: treatmentPlan || "",
      medications: Array.isArray(medications) ? medications : [],
      notes: notes || "",
    });

    const populatedRecord = await HealthRecord.findById(record._id)
      .populate("patient", "fullName phone age gender village district bloodGroup allergies existingConditions")
      .populate("recordedBy", "name fullName email role");

    return res.status(201).json({
      success: true,
      message: "Health record created successfully",
      record: populatedRecord,
    });
  } catch (error) {
    console.error("Create health record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create health record",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL HEALTH RECORDS
// ==========================================
export const getHealthRecords = async (req, res) => {
  try {
    const { patientId, recordType } = req.query;

    const query = {};

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patient = patientId;
    }

    if (recordType && recordType !== "ALL") {
      query.recordType = recordType;
    }

    const records = await HealthRecord.find(query)
      .populate("patient", "fullName phone age gender village district bloodGroup allergies existingConditions")
      .populate("recordedBy", "name fullName email role")
      .sort({ recordDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Get health records error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health records",
      error: error.message,
    });
  }
};

// ==========================================
// GET HEALTH RECORD BY ID
// ==========================================
export const getHealthRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }

    const record = await HealthRecord.findById(id)
      .populate("patient")
      .populate("recordedBy", "name fullName email role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Health record not found",
      });
    }

    return res.status(200).json({
      success: true,
      record,
    });
  } catch (error) {
    console.error("Get health record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch health record",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE HEALTH RECORD
// ==========================================
export const updateHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }

    const updates = { ...req.body };
    if (updates.recordDate) {
      updates.recordDate = new Date(updates.recordDate);
    }

    const record = await HealthRecord.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "fullName phone age gender village district bloodGroup allergies existingConditions")
      .populate("recordedBy", "name fullName email role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Health record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Health record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Update health record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update health record",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE HEALTH RECORD
// ==========================================
export const deleteHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid record ID",
      });
    }

    const record = await HealthRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Health record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Health record removed successfully",
    });
  } catch (error) {
    console.error("Delete health record error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete health record",
      error: error.message,
    });
  }
};
