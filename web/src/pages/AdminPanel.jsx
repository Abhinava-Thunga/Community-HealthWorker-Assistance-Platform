import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "./AdminPanel.css";

const AdminPanel = ({ onLogout }) => {
  const navigate = useNavigate();

  // Current logged in user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = user.fullName || user.name || "Administrator";
  const userRole = user.role || "WORKER";
  const firstLetter = userName.charAt(0).toUpperCase();

  const isAdmin = userRole === "ADMIN";

  // State
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    activeWorkers: 0,
    totalPatients: 0,
    totalAppointments: 0,
    scheduledAppointments: 0,
    completedAppointments: 0,
    totalHealthRecords: 0,
    urgentTriageCases: 0,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, PENDING, ACTIVE, INACTIVE
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Load platform stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.warn("Could not load admin stats:", err.message);
    }
  }, []);

  // Load users list
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      if (roleFilter !== "ALL") {
        params.append("role", roleFilter);
      }
      if (activeTab === "PENDING") {
        params.append("isApproved", "false");
      } else if (activeTab === "ACTIVE") {
        params.append("status", "ACTIVE");
      } else if (activeTab === "INACTIVE") {
        params.append("status", "INACTIVE");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/admin/users${queryString}`);
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      showToast(err.response?.data?.message || "Failed to load user list", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, activeTab]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadUsers();
    }
  }, [isAdmin, loadStats, loadUsers]);

  // Handle Approve
  const handleApprove = async (id, name) => {
    try {
      const res = await api.put(`/admin/users/${id}/approve`);
      showToast(res.data?.message || `Approved ${name}`, "success");
      loadUsers();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve user", "error");
    }
  };

  // Handle Reject / Deactivate
  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate or reject ${name}?`)) return;
    try {
      const res = await api.put(`/admin/users/${id}/reject`);
      showToast(res.data?.message || `Deactivated ${name}`, "info");
      loadUsers();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/status`);
      showToast(res.data?.message || "Status updated", "success");
      loadUsers();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to toggle status", "error");
    }
  };

  // Handle Role Change
  const handleChangeRole = async (id, currentRole) => {
    const newRole = currentRole === "ADMIN" ? "WORKER" : "ADMIN";
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      const res = await api.put(`/admin/users/${id}/role`, { role: newRole });
      showToast(res.data?.message || `Role updated to ${newRole}`, "success");
      loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update role", "error");
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`⚠️ Are you sure you want to PERMANENTLY delete user "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${id}`);
      showToast(res.data?.message || `Deleted ${name}`, "success");
      loadUsers();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
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

  // Non-admin block
  if (!isAdmin) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <div className="header-inner">
            <Link to="/dashboard" className="brand">
              <img src="/logo.png" alt="Community Health Worker" className="brand-logo" />
              <div className="brand-text">
                <h1>Community Health Worker</h1>
                <p>ASSISTANCE PLATFORM</p>
              </div>
            </Link>
            <button className="btn-refresh" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <div className="admin-main">
          <div className="admin-card-section" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <span style={{ fontSize: "3.5rem" }}>🔒</span>
            <h2 style={{ margin: "1rem 0 0.5rem" }}>Administrator Access Required</h2>
            <p style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto 1.5rem" }}>
              The Administration Panel is reserved for personnel with ADMIN privileges.
            </p>
            <button className="btn-primary-admin" style={{ margin: "0 auto" }} onClick={() => navigate("/dashboard")}>
              Return to Worker Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* HEADER */}
      <header className="admin-header">
        <div className="header-inner">
          <Link to="/dashboard" className="brand">
            <img src="/logo.png" alt="Community Health Worker" className="brand-logo" />
            <div className="brand-text">
              <h1>Community Health Worker</h1>
              <p>ASSISTANCE PLATFORM</p>
            </div>
          </Link>

          <nav className="header-nav">
            <Link to="/dashboard" className="nav-item">Dashboard</Link>
            <Link to="/patients" className="nav-item">Patients</Link>
            <Link to="/appointments" className="nav-item">Appointments</Link>
            <Link to="/health-records" className="nav-item">Health Records</Link>
            <Link to="/ai-assistant" className="nav-item">AI Assistant</Link>
            <Link to="/admin" className="nav-item admin-nav-pill active">🛡️ Admin Panel</Link>
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
      <main className="admin-main">
        {/* Title and Action */}
        <div className="admin-title-row">
          <div>
            <h2>🛡️ Platform Governance & Health Worker Management</h2>
            <p>Review registrations, approve new field health workers, and audit system-wide clinical metrics.</p>
          </div>
          <div className="admin-actions-bar">
            <button className="btn-refresh" onClick={() => { loadStats(); loadUsers(); }}>
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="admin-stats-grid">
          <div className={`admin-stat-card ${stats.pendingApprovals > 0 ? "urgent" : ""}`}>
            <div className="admin-stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}>
              ⏳
            </div>
            <div className="admin-stat-info">
              <h3>Pending Approvals</h3>
              <div className="stat-number">
                {stats.pendingApprovals}
                {stats.pendingApprovals > 0 && <span className="stat-badge badge-urgent">Action Needed</span>}
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#e0f2fe", color: "#0284c7" }}>
              👥
            </div>
            <div className="admin-stat-info">
              <h3>Total Health Workers</h3>
              <div className="stat-number">{stats.totalUsers}</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
              🧑‍🤝‍🧑
            </div>
            <div className="admin-stat-info">
              <h3>Registered Patients</h3>
              <div className="stat-number">{stats.totalPatients}</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#faf5ff", color: "#9333ea" }}>
              🗓️
            </div>
            <div className="admin-stat-info">
              <h3>Field Appointments</h3>
              <div className="stat-number">{stats.totalAppointments}</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
              📋
            </div>
            <div className="admin-stat-info">
              <h3>Health & Vitals Logs</h3>
              <div className="stat-number">{stats.totalHealthRecords}</div>
            </div>
          </div>
        </div>

        {/* USER MANAGEMENT SECTION */}
        <div className="admin-card-section">
          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <div className="admin-search-box">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search workers by name, email, phone, or district..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-filter-tabs">
              <button
                className={`filter-tab ${activeTab === "ALL" ? "active" : ""}`}
                onClick={() => setActiveTab("ALL")}
              >
                All Users ({stats.totalUsers})
              </button>
              <button
                className={`filter-tab ${activeTab === "PENDING" ? "active" : ""}`}
                onClick={() => setActiveTab("PENDING")}
              >
                Pending Approvals
                {stats.pendingApprovals > 0 && (
                  <span className="tab-badge">{stats.pendingApprovals}</span>
                )}
              </button>
              <button
                className={`filter-tab ${activeTab === "ACTIVE" ? "active" : ""}`}
                onClick={() => setActiveTab("ACTIVE")}
              >
                Active
              </button>
              <button
                className={`filter-tab ${activeTab === "INACTIVE" ? "active" : ""}`}
                onClick={() => setActiveTab("INACTIVE")}
              >
                Inactive
              </button>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "0.5rem 0.8rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                background: "#ffffff",
                fontWeight: "600",
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="WORKER">Health Workers</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="admin-empty-state">
              <div className="empty-icon">⏳</div>
              <p>Loading health worker accounts...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="admin-empty-state">
              <div className="empty-icon">📂</div>
              <h3>No users found</h3>
              <p>Try clearing your search query or switching tabs.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Health Worker / User</th>
                    <th>ASHA / Worker ID</th>
                    <th>Contact & District</th>
                    <th>Role</th>
                    <th>Email Verified</th>
                    <th>Approval Status</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const initials = (u.fullName || u.name || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase();

                    const isSelf = String(u._id) === String(user.id || user._id);

                    return (
                      <tr key={u._id}>
                        {/* Profile */}
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-table-avatar">{initials}</div>
                            <div>
                              <div className="user-meta-name">
                                {u.fullName || u.name}
                                {isSelf && <span style={{ fontSize: "0.75rem", color: "#0284c7" }}>(You)</span>}
                              </div>
                              <div className="user-meta-email">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* ASHA / Worker ID */}
                        <td>
                          <span style={{
                            display: "inline-block",
                            padding: "0.25rem 0.65rem",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            borderRadius: "6px",
                            fontWeight: "700",
                            fontSize: "0.825rem",
                            letterSpacing: "0.5px",
                          }}>
                            🪪 {u.workerId || u.employeeId || "N/A"}
                          </span>
                        </td>

                        {/* Contact & District */}
                        <td>
                          <div>📞 {u.phone || "N/A"}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            📍 {u.district || u.organization || "General Ward"}
                          </div>
                        </td>

                        {/* Role */}
                        <td>
                          <span className={`badge-role ${String(u.role).toLowerCase()}`}>
                            {u.role === "ADMIN" ? "🛡️ ADMIN" : "👥 WORKER"}
                          </span>
                        </td>

                        {/* Email Verified */}
                        <td>
                          {u.isEmailVerified ? (
                            <span style={{ color: "#16a34a", fontWeight: "600" }}>✓ Verified</span>
                          ) : (
                            <span style={{ color: "#d97706" }}>⚠️ Pending</span>
                          )}
                        </td>

                        {/* Approval Status */}
                        <td>
                          {u.isApproved ? (
                            <span className="status-pill approved">✓ Approved</span>
                          ) : (
                            <span className="status-pill pending">⏳ Pending Approval</span>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`status-pill ${String(u.status).toLowerCase()}`}>
                            {u.status || "INACTIVE"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-btn-group">
                            {!u.isApproved ? (
                              <button
                                className="btn-act btn-act-approve"
                                onClick={() => handleApprove(u._id, u.fullName)}
                                title="Approve and activate this worker immediately"
                              >
                                ✓ Approve
                              </button>
                            ) : (
                              <button
                                className="btn-act btn-act-toggle"
                                onClick={() => handleToggleStatus(u._id)}
                                title="Toggle between Active and Inactive"
                              >
                                {u.status === "ACTIVE" ? "⏸ Suspend" : "▶ Activate"}
                              </button>
                            )}

                            {!isSelf && (
                              <button
                                className="btn-act btn-act-role"
                                onClick={() => handleChangeRole(u._id, u.role)}
                                title="Promote to Admin or change role"
                              >
                                ⇄ {u.role === "ADMIN" ? "Make Worker" : "Make Admin"}
                              </button>
                            )}

                            {!isSelf && (
                              <button
                                className="btn-act btn-act-delete"
                                onClick={() => handleDeleteUser(u._id, u.fullName)}
                                title="Delete user"
                              >
                                🗑️
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default AdminPanel;
