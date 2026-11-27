import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import sendEmail from "../services/emailService.js";

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
      patientEmail,
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

    // If an email is provided in the appointment form and patient lacks it or changed it, persist it
    if (patientEmail && patientEmail.trim() && patientEmail.trim().toLowerCase() !== patient.email) {
      patient.email = patientEmail.trim().toLowerCase();
      await patient.save();
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
      .populate("patient", "fullName phone age gender village district bloodGroup email")
      .populate("worker", "name fullName email role");

    // ==========================================
    // DISPATCH CONFIRMATION EMAIL TO PATIENT
    // ==========================================
    let emailSent = false;
    const targetEmail = (patientEmail || patient.email || "").trim().toLowerCase();

    if (targetEmail && targetEmail.includes("@")) {
      try {
        const formattedDate = new Date(appointmentDate).toLocaleDateString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const workerName = req.user.fullName || req.user.name || "Community Health Worker";
        const apptLocation = location || "Community Health Center";
        const apptTime = timeSlot || "10:00 AM";

        const subject = `Appointment Confirmation: ${formattedDate} at ${apptTime} - Community Health Worker Platform`;
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">Community Health Worker Platform</h1>
              <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.9;">Appointment Confirmation Notification</p>
            </div>

            <!-- Body -->
            <div style="padding: 28px 24px; color: #334155;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5;">Dear <strong>${patient.fullName}</strong>,</p>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #475569;">
                Your healthcare visit has been scheduled successfully by your community health worker. Please review the appointment details below:
              </p>

              <!-- Appointment Details Box -->
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0d9488; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 35%; font-weight: 600;">📅 Date:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">⏰ Time Slot:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${apptTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📍 Place / Location:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${apptLocation}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🩺 Purpose of Visit:</td>
                    <td style="padding: 8px 0; color: #0d9488; font-weight: 700;">${purpose}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🚨 Priority:</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${priority || "MEDIUM"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">👩‍⚕️ Assigned Worker:</td>
                    <td style="padding: 8px 0; color: #0f172a;">${workerName} (${req.user.role || "WORKER"})</td>
                  </tr>
                  ${notes ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600; vertical-align: top;">📝 Instructions / Notes:</td>
                    <td style="padding: 8px 0; color: #334155; line-height: 1.4;">${notes}</td>
                  </tr>` : ""}
                </table>
              </div>

              <!-- Helpful Tips -->
              <div style="background-color: #f0fdfa; border: 1px dashed #5eead4; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #115e59; line-height: 1.5;">
                  💡 <strong>Preparation Tip:</strong> Please keep your previous prescriptions, health records, or immunization cards ready for the visit.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                If you need to reschedule or have urgent questions, please contact your local community health worker or visit your nearest Primary Health Center (PHC).
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Community Health Worker Assistance Platform &bull; Delivering care to the community.
            </div>
          </div>
        `;

        await sendEmail(targetEmail, subject, html);
        emailSent = true;
        console.log(`[Appointment] Confirmation email sent successfully to ${targetEmail}`);
      } catch (emailErr) {
        console.error("[Appointment] Failed to send confirmation email:", emailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? `Appointment scheduled and confirmation email sent to ${targetEmail}! 🗓️📧`
        : "Appointment scheduled successfully! 🗓️",
      appointment: populatedAppointment,
      emailSent,
      patientEmail: targetEmail || null,
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
