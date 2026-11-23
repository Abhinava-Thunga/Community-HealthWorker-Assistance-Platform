import User from "../models/user.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import HealthRecord from "../models/HealthRecord.js";
import AiConversation from "../models/AiConversation.js";

/**
 * Basic Admin Dashboard Status
 * GET /api/admin/dashboard
 */
export const adminDashboard = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
    user: req.user,
  });
};

/**
 * System-wide Statistics & Analytics
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingApprovals,
      activeWorkers,
      totalPatients,
      totalAppointments,
      scheduledAppointments,
      completedAppointments,
      totalHealthRecords,
      urgentTriageCases,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isApproved: false }),
      User.countDocuments({ isApproved: true, status: "ACTIVE" }),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "SCHEDULED" }),
      Appointment.countDocuments({ status: "COMPLETED" }),
      HealthRecord.countDocuments(),
      AiConversation.countDocuments({ "messages.triageLevel": "URGENT" }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingApprovals,
        activeWorkers,
        totalPatients,
        totalAppointments,
        scheduledAppointments,
        completedAppointments,
        totalHealthRecords,
        urgentTriageCases,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics",
      error: error.message,
    });
  }
};

/**
 * Get All Registered Health Workers & Users
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, isApproved } = req.query;

    const query = {};

    // Search by name, email, phone, or ASHA/Worker ID
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { workerId: regex },
        { district: regex },
      ];
    }

    // Role filter
    if (role && role !== "ALL") {
      query.role = role.toUpperCase();
    }

    // Status filter
    if (status && status !== "ALL") {
      query.status = status.toUpperCase();
    }

    // Approval status filter
    if (isApproved !== undefined && isApproved !== "ALL") {
      query.isApproved = isApproved === "true" || isApproved === true;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user list",
      error: error.message,
    });
  }
};

/**
 * Approve a Registered Health Worker
 * PUT /api/admin/users/:id/approve
 */
export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isApproved = true;
    user.status = "ACTIVE";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} approved and activated successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Approve user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve user",
      error: error.message,
    });
  }
};

/**
 * Reject or Suspend a Health Worker
 * PUT /api/admin/users/:id/reject
 */
export const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isApproved = false;
    user.status = "INACTIVE";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} registration rejected / deactivated`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Reject user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject user",
      error: error.message,
    });
  }
};

/**
 * Update User Role (e.g., WORKER <-> ADMIN)
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["ADMIN", "WORKER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified. Allowed: WORKER, ADMIN",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

/**
 * Toggle User Active Status
 * PUT /api/admin/users/:id/status
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.status = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Toggle status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle user status",
      error: error.message,
    });
  }
};

/**
 * Delete a User
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Administrators cannot delete their own account",
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.fullName} (${user.email}) permanently removed`,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};
