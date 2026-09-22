import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "./Appointments.css";

const Appointments = ({ onLogout }) => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [formData, setFormData] = useState({
    patientId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM",
    purpose: "",
    priority: "MEDIUM",
    location: "Community Health Center",
    notes: "",
    followUpDate: "",
  });

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = user.fullName || user.name || "Health Worker";
  const userRole = user.role || "WORKER";
  const firstLetter = userName.charAt(0).toUpperCase();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3500);
  };

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/appointments";
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const res = await api.get(url);
      setAppointments(res.data?.appointments || []);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      showToast("Failed to load appointments", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data?.patients || []);
    } catch (error) {
      console.error("Failed to load patients for dropdown:", error);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadPatients();
  }, [loadAppointments]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      showToast("Please select a patient", "error");
      return;
    }
    if (!formData.purpose.trim()) {
      showToast("Please enter the purpose of the visit", "error");
      return;
    }

    try {
      setScheduling(true);
      await api.post("/appointments", formData);
      showToast("Appointment scheduled successfully! 🗓️", "success");
      setShowScheduleModal(false);
      setFormData({
        patientId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "10:00 AM",
        purpose: "",
        priority: "MEDIUM",
        location: "Community Health Center",
        notes: "",
        followUpDate: "",
      });
      loadAppointments();
    } catch (error) {
      console.error("Failed to schedule appointment:", error);
      showToast(
        error.response?.data?.message || "Failed to schedule appointment",
        "error"
      );
    } finally {
      setScheduling(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdating(true);
      await api.put(`/appointments/${id}`, { status: newStatus });
      showToast(`Appointment marked as ${newStatus}`, "success");
      if (selectedAppointment && selectedAppointment._id === id) {
        setSelectedAppointment((prev) => ({ ...prev, status: newStatus }));
      }
      loadAppointments();
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast("Failed to update appointment status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const patientName = app.patient?.fullName?.toLowerCase() || "";
    const patientPhone = app.patient?.phone?.toLowerCase() || "";
    const purpose = app.purpose?.toLowerCase() || "";
    const location = app.location?.toLowerCase() || "";
    return (
      patientName.includes(term) ||
      patientPhone.includes(term) ||
      purpose.includes(term) ||
      location.includes(term)
    );
  });

  const totalCount = appointments.length;
  const scheduledCount = appointments.filter((a) => a.status === "SCHEDULED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const urgentCount = appointments.filter(
    (a) => (a.priority === "URGENT" || a.priority === "HIGH") && a.status === "SCHEDULED"
  ).length;

  return (
    <div className="appointments-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" ? "✓" : "⚠️"}
          </div>
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="page-header">
        <div className="header-inner">
          <Link to="/dashboard" className="brand">
            <img src="/logo.png" alt="Logo" className="brand-logo" />
            <div className="brand-text">
              <h1>Community Health Worker</h1>
              <p>ASSISTANCE PLATFORM</p>
            </div>
          </Link>

          <nav className="header-nav">
            <Link to="/dashboard" className="nav-item">
              Dashboard
            </Link>
            <Link to="/patients" className="nav-item">
              Patients
            </Link>
            <Link to="/appointments" className="nav-item active">
              Appointments
            </Link>
            <Link to="/health-records" className="nav-item">
              Health Records
            </Link>
          </nav>

          <div className="user-area">
            <div className="user-info">
              <strong>{userName}</strong>
              <span>{userRole}</span>
            </div>
            <div className="user-avatar">{firstLetter}</div>
            <button
              className="change-pwd-btn"
              onClick={() => setShowPasswordModal(true)}
              title="Change Password"
              style={{
                background: "#f0fdfa",
                border: "1px solid #ccfbf1",
                color: "#0d9488",
                padding: "0.4rem 0.8rem",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                transition: "all 0.2s",
              }}
            >
              🔑 Password
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="appointments-main">
        {/* HERO SECTION */}
        <div className="appointments-hero">
          <div className="hero-left">
            <span className="hero-eyebrow">CLINIC & FIELD OPERATIONS</span>
            <h2>Appointment Management</h2>
            <p>
              Organize patient checkups, home visits, maternal care visits, and
              routine immunizations across your community.
            </p>
          </div>
          <button
            className="schedule-btn primary-action-btn"
            onClick={() => setShowScheduleModal(true)}
          >
            <span>+</span> Schedule New Appointment
          </button>
        </div>

        {/* STATS OVERVIEW */}
        <div className="stats-row">
          <div className="appointment-stat-card">
            <div className="stat-icon icon-blue">📅</div>
            <div className="stat-info">
              <span className="stat-title">Total Scheduled</span>
              <h3>{totalCount}</h3>
            </div>
          </div>

          <div className="appointment-stat-card">
            <div className="stat-icon icon-amber">⏳</div>
            <div className="stat-info">
              <span className="stat-title">Upcoming / Pending</span>
              <h3>{scheduledCount}</h3>
            </div>
          </div>

          <div className="appointment-stat-card">
            <div className="stat-icon icon-green">✅</div>
            <div className="stat-info">
              <span className="stat-title">Completed Visits</span>
              <h3>{completedCount}</h3>
            </div>
          </div>

          <div className="appointment-stat-card">
            <div className="stat-icon icon-red">🚨</div>
            <div className="stat-info">
              <span className="stat-title">Urgent / High Priority</span>
              <h3>{urgentCount}</h3>
            </div>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="toolbar-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, phone, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="clear-btn" onClick={() => setSearchTerm("")}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* APPOINTMENTS LIST / TABLE */}
        <div className="appointments-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗓️</div>
              <h3>No Appointments Found</h3>
              <p>
                {searchTerm || statusFilter !== "ALL" || priorityFilter !== "ALL"
                  ? "No appointments match your filters."
                  : "You haven't scheduled any appointments yet."}
              </p>
              <button
                className="secondary-btn"
                onClick={() => setShowScheduleModal(true)}
              >
                Schedule Appointment Now
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date & Time</th>
                    <th>Purpose</th>
                    <th>Location</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((app) => {
                    const appDate = new Date(app.appointmentDate).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    );

                    return (
                      <tr key={app._id}>
                        <td>
                          <div className="patient-cell">
                            <strong>{app.patient?.fullName || "Unknown Patient"}</strong>
                            <span className="patient-sub">
                              {app.patient?.age ? `${app.patient.age}y` : ""}
                              {app.patient?.gender ? ` • ${app.patient.gender}` : ""}
                              {app.patient?.phone ? ` • ${app.patient.phone}` : ""}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="datetime-cell">
                            <span className="app-date">{appDate}</span>
                            <span className="app-time">{app.timeSlot}</span>
                          </div>
                        </td>
                        <td>
                          <span className="purpose-text">{app.purpose}</span>
                        </td>
                        <td>
                          <span className="location-text">📍 {app.location}</span>
                        </td>
                        <td>
                          <span className={`priority-badge priority-${app.priority?.toLowerCase()}`}>
                            {app.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${app.status?.toLowerCase()}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="view-btn"
                              title="View Details"
                              onClick={() => setSelectedAppointment(app)}
                            >
                              View
                            </button>
                            {app.status === "SCHEDULED" && (
                              <button
                                className="complete-btn"
                                title="Mark Completed"
                                disabled={updating}
                                onClick={() => handleStatusUpdate(app._id, "COMPLETED")}
                              >
                                ✓ Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* SCHEDULE APPOINTMENT MODAL */}
      {showScheduleModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowScheduleModal(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule New Appointment</h3>
              <button
                className="close-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="modal-form">
              <div className="form-group">
                <label>
                  Select Patient <span className="req">*</span>
                </label>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.phone} • {p.village || "No Village"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Date <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Time Slot <span className="req">*</span>
                  </label>
                  <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Purpose / Visit Reason <span className="req">*</span>
                </label>
                <input
                  type="text"
                  name="purpose"
                  placeholder="e.g. Antenatal Care Checkup, Child Immunization..."
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                />
                <div className="quick-tags">
                  <span
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        purpose: "General Health Checkup",
                      }))
                    }
                  >
                    + General Checkup
                  </span>
                  <span
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        purpose: "Antenatal Care (ANC)",
                        priority: "HIGH",
                      }))
                    }
                  >
                    + Antenatal Care
                  </span>
                  <span
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        purpose: "Child Immunization",
                      }))
                    }
                  >
                    + Immunization
                  </span>
                  <span
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        purpose: "Blood Pressure & Diabetes Check",
                      }))
                    }
                  >
                    + BP & Sugar
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  >
                    <option value="Community Health Center">
                      Community Health Center
                    </option>
                    <option value="Village Anganwadi">Village Anganwadi</option>
                    <option value="Patient Home Visit">
                      Patient Home Visit
                    </option>
                    <option value="Sub-Center">Sub-Center</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Clinical Notes / Instructions</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Any special symptoms, fasting instructions, or notes for the visit..."
                  value={formData.notes}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={scheduling}
                >
                  {scheduling ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedAppointment(null)}
        >
          <div className="modal-card detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button
                className="close-btn"
                onClick={() => setSelectedAppointment(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-header-card">
                <div>
                  <h4>{selectedAppointment.patient?.fullName || "Patient"}</h4>
                  <p>
                    {selectedAppointment.patient?.gender} •{" "}
                    {selectedAppointment.patient?.age} Years •{" "}
                    {selectedAppointment.patient?.phone}
                  </p>
                  <p className="village-badge">
                    🏡 {selectedAppointment.patient?.village || "Community"}
                    {selectedAppointment.patient?.district
                      ? `, ${selectedAppointment.patient.district}`
                      : ""}
                  </p>
                </div>
                <div className="detail-badges">
                  <span
                    className={`priority-badge priority-${selectedAppointment.priority?.toLowerCase()}`}
                  >
                    {selectedAppointment.priority}
                  </span>
                  <span
                    className={`status-badge status-${selectedAppointment.status?.toLowerCase()}`}
                  >
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>Scheduled Date</label>
                  <span>
                    {new Date(
                      selectedAppointment.appointmentDate
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Time Slot</label>
                  <span>{selectedAppointment.timeSlot}</span>
                </div>
                <div className="detail-item">
                  <label>Purpose</label>
                  <strong>{selectedAppointment.purpose}</strong>
                </div>
                <div className="detail-item">
                  <label>Location</label>
                  <span>📍 {selectedAppointment.location}</span>
                </div>
                <div className="detail-item">
                  <label>Health Worker</label>
                  <span>
                    {selectedAppointment.worker?.fullName ||
                      selectedAppointment.worker?.name ||
                      "Assigned Worker"}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Blood Group</label>
                  <span>{selectedAppointment.patient?.bloodGroup || "N/A"}</span>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div className="notes-box">
                  <label>Notes & Instructions:</label>
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}

              <div className="detail-actions">
                {selectedAppointment.status === "SCHEDULED" ? (
                  <>
                    <button
                      className="complete-btn"
                      disabled={updating}
                      onClick={() =>
                        handleStatusUpdate(selectedAppointment._id, "COMPLETED")
                      }
                    >
                      ✓ Mark Completed
                    </button>
                    <button
                      className="cancel-action-btn"
                      disabled={updating}
                      onClick={() =>
                        handleStatusUpdate(selectedAppointment._id, "CANCELLED")
                      }
                    >
                      ✕ Cancel Appointment
                    </button>
                  </>
                ) : (
                  <button
                    className="reopen-btn"
                    disabled={updating}
                    onClick={() =>
                      handleStatusUpdate(selectedAppointment._id, "SCHEDULED")
                    }
                  >
                    ↺ Reopen Appointment
                  </button>
                )}

                <button
                  className="add-record-btn"
                  onClick={() => {
                    navigate("/health-records", {
                      state: { patientId: selectedAppointment.patient?._id },
                    });
                  }}
                >
                  📋 Add Health Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};

export default Appointments;
