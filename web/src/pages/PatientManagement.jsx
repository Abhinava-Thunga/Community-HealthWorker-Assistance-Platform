import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";

import "./PatientManagement.css";

const PatientManagement = ({ onLogout }) => {

  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    village: "",
    district: "",
    state: "",
    pincode: "",
    bloodGroup: "",
    status: "ACTIVE",
    allergies: "",
    existingConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Read logged-in user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName = user.fullName || user.name || "Health Worker";
  const userRole = user.role || "WORKER";

  // ==========================================
  // TOAST
  // ==========================================

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3500);
  };

  // ==========================================
  // LOAD PATIENTS FROM API
  // ==========================================

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/patients");
      const data = response.data?.patients || [];
      setPatients(data);
    } catch (error) {
      console.error("Failed to load patients:", error);
      if (error.response?.status === 401) {
        showToast("Session expired. Please login again.", "error");
      } else {
        showToast("Failed to load patients.", "error");
      }
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // ==========================================
  // SEARCH PATIENTS VIA API
  // ==========================================

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      loadPatients();
      return;
    }

    try {
      setSearching(true);
      const response = await api.get(`/patients/search?q=${encodeURIComponent(query.trim())}`);
      setPatients(response.data?.patients || []);
    } catch (error) {
      console.error("Search error:", error);
      showToast("Search failed.", "error");
    } finally {
      setSearching(false);
    }
  }, [loadPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, handleSearch]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // REGISTER PATIENT VIA API
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      showToast("Please enter patient's full name.", "error");
      return;
    }

    if (!formData.age) {
      showToast("Please enter patient's age.", "error");
      return;
    }

    if (!formData.gender) {
      showToast("Please select gender.", "error");
      return;
    }

    if (!formData.phone.trim()) {
      showToast("Please enter patient's phone number.", "error");
      return;
    }

    try {
      setRegistering(true);

      const payload = {
        fullName: formData.fullName.trim(),
        age: Number(formData.age),
        gender: formData.gender.toUpperCase(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        village: formData.village.trim(),
        district: formData.district.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        bloodGroup: formData.bloodGroup,
        status: formData.status.toUpperCase(),
        allergies: formData.allergies.trim(),
        existingConditions: formData.existingConditions.trim(),
        emergencyContactName: formData.emergencyContactName.trim(),
        emergencyContactPhone: formData.emergencyContactPhone.trim(),
      };

      await api.post("/patients", payload);

      // Clear form
      setFormData({
        fullName: "",
        age: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        village: "",
        district: "",
        state: "",
        pincode: "",
        bloodGroup: "",
        status: "ACTIVE",
        allergies: "",
        existingConditions: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
      });

      setShowRegister(false);

      showToast("Patient registered successfully!");

      // Refresh patient list from API
      setSearch("");
      await loadPatients();

      // Notify dashboard
      window.dispatchEvent(new Event("patientsUpdated"));

    } catch (error) {
      console.error("Register patient error:", error);
      showToast(
        error.response?.data?.message || "Failed to register patient.",
        "error"
      );
    } finally {
      setRegistering(false);
    }
  };

  // ==========================================
  // VIEW PATIENT
  // ==========================================

  const handleView = async (patient) => {
    try {
      // Fetch fresh data from API
      const response = await api.get(`/patients/${patient._id}`);
      setSelectedPatient(response.data?.patient || patient);
      setEditMode(false);
    } catch (error) {
      console.error("Fetch patient error:", error);
      // Fallback to cached data
      setSelectedPatient(patient);
      setEditMode(false);
    }
  };

  // ==========================================
  // EDIT PATIENT
  // ==========================================

  const startEdit = () => {
    if (!selectedPatient) return;

    setEditData({
      fullName: selectedPatient.fullName || "",
      age: selectedPatient.age || "",
      gender: selectedPatient.gender || "",
      phone: selectedPatient.phone || "",
      email: selectedPatient.email || "",
      address: selectedPatient.address || "",
      village: selectedPatient.village || "",
      district: selectedPatient.district || "",
      state: selectedPatient.state || "",
      pincode: selectedPatient.pincode || "",
      bloodGroup: selectedPatient.bloodGroup || "",
      status: selectedPatient.status || "ACTIVE",
      allergies: selectedPatient.allergies || "",
      existingConditions: selectedPatient.existingConditions || "",
      emergencyContactName: selectedPatient.emergencyContactName || "",
      emergencyContactPhone: selectedPatient.emergencyContactPhone || "",
    });

    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient?._id) return;

    try {
      setSaving(true);

      const payload = {
        fullName: editData.fullName.trim(),
        age: Number(editData.age),
        gender: editData.gender.toUpperCase(),
        phone: editData.phone.trim(),
        email: editData.email.trim(),
        address: editData.address.trim(),
        village: editData.village.trim(),
        district: editData.district.trim(),
        state: editData.state.trim(),
        pincode: editData.pincode.trim(),
        bloodGroup: editData.bloodGroup,
        status: editData.status.toUpperCase(),
        allergies: editData.allergies.trim(),
        existingConditions: editData.existingConditions.trim(),
        emergencyContactName: editData.emergencyContactName.trim(),
        emergencyContactPhone: editData.emergencyContactPhone.trim(),
      };

      const response = await api.put(
        `/patients/${selectedPatient._id}`,
        payload
      );

      setSelectedPatient(response.data?.patient || selectedPatient);
      setEditMode(false);

      showToast("Patient updated successfully!");

      // Refresh list
      await loadPatients();

      // Notify dashboard
      window.dispatchEvent(new Event("patientsUpdated"));

    } catch (error) {
      console.error("Update patient error:", error);
      showToast(
        error.response?.data?.message || "Failed to update patient.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  const displayGender = (gender) => {
    if (!gender) return "—";
    const g = gender.toUpperCase();
    if (g === "MALE") return "Male";
    if (g === "FEMALE") return "Female";
    if (g === "OTHER") return "Other";
    return gender;
  };

  const displayStatus = (status) => {
    if (!status) return "Active";
    const s = status.toUpperCase();
    if (s === "ACTIVE") return "Active";
    if (s === "INACTIVE") return "Inactive";
    return status;
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // ==========================================
  // COMPUTED STATS
  // ==========================================

  const totalPatients = patients.length;

  const activeCount = patients.filter(
    (p) => !p.status || p.status.toUpperCase() === "ACTIVE"
  ).length;

  const femaleCount = patients.filter(
    (p) => p.gender && p.gender.toUpperCase() === "FEMALE"
  ).length;

  const maleCount = patients.filter(
    (p) => p.gender && p.gender.toUpperCase() === "MALE"
  ).length;


  return (

    <div className="patient-page">

      {/* TOAST */}
      {toast.show && (
        <div className={`toast-notification ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          <span>{toast.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="patient-header">

        <div className="patient-header-inner">

          <Link
            to="/dashboard"
            className="patient-brand"
          >

            <img
              src="/logo.png"
              alt="Community Health Worker"
            />

            <div>

              <h1>
                Community Health Worker
              </h1>

              <p>
                ASSISTANCE PLATFORM
              </p>

            </div>

          </Link>

          <nav className="header-nav" style={{ display: "flex", gap: "0.5rem" }}>
            <Link to="/dashboard" className="nav-item">
              Dashboard
            </Link>
            <Link to="/patients" className="nav-item active">
              Patients
            </Link>
            <Link to="/appointments" className="nav-item">
              Appointments
            </Link>
            <Link to="/health-records" className="nav-item">
              Health Records
            </Link>
          </nav>

          <div className="patient-user">

            <span>
              {userName}
            </span>

            <span className="worker-badge">
              {userRole}
            </span>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="patient-logout"
              title="Change Password"
              style={{
                background: "#f0fdfa",
                borderColor: "#ccfbf1",
                color: "#0d9488",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              🔑 Password
            </button>

            <button
              onClick={handleLogout}
              className="patient-logout"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="patient-main">

        {/* Top */}

        <div className="patient-page-top">

          <div>

            <button
              className="back-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Dashboard
            </button>

            <h2>
              Patient Management
            </h2>

            <p>
              Register, search and manage community patient
              information from one place.
            </p>

          </div>

          <button
            className="register-button"
            onClick={() =>
              setShowRegister(true)
            }
          >
            + Register Patient
          </button>

        </div>

        {/* ======================================
            STATS
        ====================================== */}

        <div className="patient-stats">

          <div className="patient-stat-card">
            <div className="patient-stat-icon">👥</div>
            <div>
              <span>Total Patients</span>
              <strong>{loading ? "..." : totalPatients}</strong>
            </div>
          </div>

          <div className="patient-stat-card">
            <div className="patient-stat-icon">✓</div>
            <div>
              <span>Active Patients</span>
              <strong>{loading ? "..." : activeCount}</strong>
            </div>
          </div>

          <div className="patient-stat-card">
            <div className="patient-stat-icon">♀</div>
            <div>
              <span>Female Patients</span>
              <strong>{loading ? "..." : femaleCount}</strong>
            </div>
          </div>

          <div className="patient-stat-card">
            <div className="patient-stat-icon">♂</div>
            <div>
              <span>Male Patients</span>
              <strong>{loading ? "..." : maleCount}</strong>
            </div>
          </div>

        </div>

        {/* ======================================
            RECORDS
        ====================================== */}

        <section className="patient-records">

          <div className="records-heading">

            <div>
              <span>PATIENT DIRECTORY</span>
              <h3>Patient Records</h3>
              <p>Search and manage registered patients.</p>
            </div>

            <div className="search-box">
              🔍
              <input
                type="text"
                placeholder="Search name, phone, village or district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searching && <span className="search-spinner"></span>}
            </div>

          </div>

          {loading ? (

            <div className="empty-state">
              <div className="loading-spinner-large"></div>
              <h3>Loading patients...</h3>
              <p>Fetching records from database.</p>
            </div>

          ) : patients.length === 0 ? (

            <div className="empty-state">
              <div>👥</div>
              <h3>No patients found</h3>
              <p>
                {search
                  ? "Try a different search."
                  : "Register your first patient to get started."}
              </p>

              {!search && (
                <button
                  onClick={() => setShowRegister(true)}
                  className="register-button"
                >
                  + Register Patient
                </button>
              )}
            </div>

          ) : (

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Blood Group</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {patients.map((patient) => (

                    <tr key={patient._id || patient.id}>

                      <td>
                        <div className="patient-name">
                          <div className="patient-avatar">
                            {getInitials(patient.fullName || patient.name)}
                          </div>
                          <div>
                            <strong>
                              {patient.fullName || patient.name || "Unknown"}
                            </strong>
                            <span>
                              {patient.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{patient.age || "—"}</td>

                      <td>{displayGender(patient.gender)}</td>

                      <td>
                        <strong>{patient.phone || "—"}</strong>
                      </td>

                      <td>
                        {patient.village || patient.district || "—"}
                      </td>

                      <td>
                        {patient.bloodGroup || "—"}
                      </td>

                      <td>
                        <span
                          className={
                            (!patient.status || patient.status.toUpperCase() === "ACTIVE")
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {displayStatus(patient.status)}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleView(patient)}
                          >
                            View / Edit
                          </button>
                        </div>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

      {/* ======================================
          REGISTER MODAL
      ====================================== */}

      {showRegister && (

        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowRegister(false);
        }}>

          <div className="register-modal">

            <div className="modal-header">

              <div>
                <span>NEW RECORD</span>
                <h2>Register Patient</h2>
                <p>Enter the patient's information below.</p>
              </div>

              <button
                onClick={() => setShowRegister(false)}
                className="close-button"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleRegister}
              className="patient-form"
            >

              {/* BASIC */}

              <div className="form-section">

                <h3>Basic Information</h3>
                <p>Patient's personal details</p>

                <div className="form-grid">

                  <div className="form-field full">
                    <label>Full Name *</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter patient's full name"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      placeholder="Age"
                      min="0"
                      max="120"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Phone *</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email address"
                    />
                  </div>

                  <div className="form-field">
                    <label>Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                    >
                      <option value="">Select blood group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* ADDRESS */}

              <div className="form-section">

                <h3>Address</h3>
                <p>Patient's location details</p>

                <div className="form-grid">

                  <div className="form-field full">
                    <label>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House number, street, locality..."
                    />
                  </div>

                  <div className="form-field">
                    <label>Village</label>
                    <input
                      name="village"
                      value={formData.village}
                      onChange={handleChange}
                      placeholder="Village"
                    />
                  </div>

                  <div className="form-field">
                    <label>District</label>
                    <input
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="District"
                    />
                  </div>

                  <div className="form-field">
                    <label>State</label>
                    <input
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                  </div>

                  <div className="form-field">
                    <label>Pincode</label>
                    <input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                    />
                  </div>

                </div>

              </div>

              {/* EMERGENCY */}

              <div className="form-section">

                <h3>Emergency Contact</h3>
                <p>Person to contact during emergencies</p>

                <div className="form-grid">

                  <div className="form-field">
                    <label>Contact Name</label>
                    <input
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                      placeholder="Contact person's name"
                    />
                  </div>

                  <div className="form-field">
                    <label>Contact Phone</label>
                    <input
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                      placeholder="Emergency phone"
                    />
                  </div>

                </div>

              </div>

              {/* HEALTH */}

              <div className="form-section">

                <h3>Health Information</h3>
                <p>Basic healthcare information</p>

                <div className="form-grid">

                  <div className="form-field">
                    <label>Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="Known allergies..."
                    />
                  </div>

                  <div className="form-field">
                    <label>Existing Conditions</label>
                    <textarea
                      name="existingConditions"
                      value={formData.existingConditions}
                      onChange={handleChange}
                      placeholder="Existing medical conditions..."
                    />
                  </div>

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowRegister(false)}
                  disabled={registering}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={registering}
                >
                  {registering ? "Registering patient..." : "Register Patient"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================
          VIEW / EDIT PATIENT MODAL
      ====================================== */}

      {selectedPatient && (

        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedPatient(null);
            setEditMode(false);
          }
        }}>

          <div className="view-modal">

            <button
              className="close-button"
              onClick={() => {
                setSelectedPatient(null);
                setEditMode(false);
              }}
            >
              ×
            </button>

            {!editMode ? (
              /* VIEW MODE */
              <>
                <div className="view-avatar">
                  {getInitials(selectedPatient.fullName || selectedPatient.name)}
                </div>

                <h2>
                  {selectedPatient.fullName || selectedPatient.name || "Unknown"}
                </h2>

                <p>
                  {selectedPatient.age} years •{" "}
                  {displayGender(selectedPatient.gender)}
                </p>

                <div className="patient-details">

                  <div>
                    <span>Phone</span>
                    <strong>{selectedPatient.phone || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selectedPatient.email || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Blood Group</span>
                    <strong>{selectedPatient.bloodGroup || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>{displayStatus(selectedPatient.status)}</strong>
                  </div>

                  <div>
                    <span>Village</span>
                    <strong>{selectedPatient.village || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>District</span>
                    <strong>{selectedPatient.district || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>State</span>
                    <strong>{selectedPatient.state || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Pincode</span>
                    <strong>{selectedPatient.pincode || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Address</span>
                    <strong>{selectedPatient.address || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Emergency Contact</span>
                    <strong>{selectedPatient.emergencyContactName || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Emergency Phone</span>
                    <strong>{selectedPatient.emergencyContactPhone || "Not provided"}</strong>
                  </div>

                  <div>
                    <span>Allergies</span>
                    <strong>{selectedPatient.allergies || "None"}</strong>
                  </div>

                  <div>
                    <span>Existing Conditions</span>
                    <strong>{selectedPatient.existingConditions || "None"}</strong>
                  </div>

                </div>

                <div className="view-actions" style={{ flexWrap: "wrap", gap: "8px" }}>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setEditMode(false);
                    }}
                  >
                    Close
                  </button>

                  <button
                    className="save-button"
                    onClick={startEdit}
                  >
                    Edit Patient
                  </button>

                  <button
                    className="save-button"
                    style={{ background: "#0284c7" }}
                    onClick={() => navigate("/appointments")}
                  >
                    🗓️ Schedule Visit
                  </button>

                  <button
                    className="save-button"
                    style={{ background: "#059669" }}
                    onClick={() =>
                      navigate("/health-records", {
                        state: { patientId: selectedPatient._id },
                      })
                    }
                  >
                    📋 Add Health Record
                  </button>
                </div>
              </>

            ) : (
              /* EDIT MODE */
              <>
                <h2 style={{ marginBottom: "6px" }}>Edit Patient</h2>
                <p style={{ color: "#678397", marginBottom: "20px" }}>
                  Update patient information below.
                </p>

                <div className="edit-form-grid">

                  <div className="edit-field">
                    <label>Full Name</label>
                    <input
                      name="fullName"
                      value={editData.fullName}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={editData.age}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="edit-field">
                    <label>Gender</label>
                    <select name="gender" value={editData.gender} onChange={handleEditChange}>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>Phone</label>
                    <input name="phone" value={editData.phone} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Email</label>
                    <input name="email" value={editData.email} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={editData.bloodGroup} onChange={handleEditChange}>
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>Status</label>
                    <select name="status" value={editData.status} onChange={handleEditChange}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  <div className="edit-field">
                    <label>Village</label>
                    <input name="village" value={editData.village} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>District</label>
                    <input name="district" value={editData.district} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>State</label>
                    <input name="state" value={editData.state} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Pincode</label>
                    <input name="pincode" value={editData.pincode} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Address</label>
                    <input name="address" value={editData.address} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Emergency Contact</label>
                    <input name="emergencyContactName" value={editData.emergencyContactName} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Emergency Phone</label>
                    <input name="emergencyContactPhone" value={editData.emergencyContactPhone} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Allergies</label>
                    <input name="allergies" value={editData.allergies} onChange={handleEditChange} />
                  </div>

                  <div className="edit-field">
                    <label>Existing Conditions</label>
                    <input name="existingConditions" value={editData.existingConditions} onChange={handleEditChange} />
                  </div>

                </div>

                <div className="view-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="save-button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}

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

export default PatientManagement;