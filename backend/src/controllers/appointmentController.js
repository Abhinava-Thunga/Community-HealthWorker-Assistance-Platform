import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

// ==========================================
// CREATE APPOINTMENT
// ==========================================
export const createAppointment = async (req, res) => {
  try {
    const {
      patientId,
      appointmentDate,
      timeSlot,
      purpose,
      priority,
      location,
      notes,
      followUpDate,
    } = req.body;

    if (!patientId || !appointmentDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Patient, appointment date, and purpose are required",
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

    const appointment = await Appointment.create({
      patient: patientId,
      worker: req.user._id,
      appointmentDate: new Date(appointmentDate),
      timeSlot: timeSlot || "10:00 AM",
      purpose: purpose.trim(),
      priority: priority || "MEDIUM",
      location: location || "Community Health Center",
      notes: notes || "",
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: "SCHEDULED",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "fullName phone age gender village district bloodGroup")
      .populate("worker", "name fullName email role");

    return res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule appointment",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL APPOINTMENTS
// ==========================================
export const getAppointments = async (req, res) => {
  try {
    const { status, patientId, date, priority } = req.query;

    const query = {};

    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }

    if (priority && priority !== "ALL") {
      query.priority = priority.toUpperCase();
    }

    if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
      query.patient = patientId;
    }

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate("patient", "fullName phone age gender village district bloodGroup")
      .populate("worker", "name fullName email role")
      .sort({ appointmentDate: 1, timeSlot: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};

// ==========================================
// GET APPOINTMENT BY ID
// ==========================================
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(id)
      .populate("patient")
      .populate("worker", "name fullName email role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE APPOINTMENT
// ==========================================
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const updates = { ...req.body };

    if (updates.appointmentDate) {
      updates.appointmentDate = new Date(updates.appointmentDate);
    }
    if (updates.followUpDate) {
      updates.followUpDate = new Date(updates.followUpDate);
    }

    const appointment = await Appointment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "fullName phone age gender village district bloodGroup")
      .populate("worker", "name fullName email role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE APPOINTMENT
// ==========================================
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment removed successfully",
    });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message,
    });
  }
};
