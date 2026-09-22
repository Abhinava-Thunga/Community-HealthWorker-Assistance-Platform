import mongoose from "mongoose";
import Patient from "../models/Patient.js";

// ==========================================
// CREATE PATIENT
// ==========================================

export const createPatient = async (req, res) => {
  try {
    const {
      fullName,
      age,
      gender,
      phone,
      email,
      address,
      village,
      district,
      state,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      existingConditions,
    } = req.body;

    if (!fullName || age === undefined || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, age, gender and phone are required",
      });
    }

    const patient = await Patient.create({
      fullName,
      age,
      gender,
      phone,
      email,
      address,
      village,
      district,
      state,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      allergies,
      existingConditions,
      registeredBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      patient,
    });
  } catch (error) {
    console.error("Create Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to register patient",
    });
  }
};

// ==========================================
// GET ALL PATIENTS
// ==========================================

export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate(
        "registeredBy",
        "fullName email role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Get Patients Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};

// ==========================================
// GET SINGLE PATIENT
// ==========================================

export const getPatientById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patient = await Patient.findById(
      req.params.id
    ).populate(
      "registeredBy",
      "fullName email role"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error("Get Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient",
    });
  }
};

// ==========================================
// UPDATE PATIENT
// ==========================================

export const updatePatient = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    const patient = await Patient.findById(
      req.params.id
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const allowedFields = [
      "fullName",
      "age",
      "gender",
      "phone",
      "email",
      "address",
      "village",
      "district",
      "state",
      "pincode",
      "emergencyContactName",
      "emergencyContactPhone",
      "bloodGroup",
      "allergies",
      "existingConditions",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Update Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
    });
  }
};

// ==========================================
// SEARCH PATIENTS
// ==========================================

export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchTerm = q.trim();

    const patients = await Patient.find({
      $or: [
        {
          fullName: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          village: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          district: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ],
    })
      .populate(
        "registeredBy",
        "fullName email role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Search Patient Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search patients",
    });
  }
};