import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";
import "./HealthRecords.css";

const HealthRecords = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const initialPatientId = location.state?.patientId || "";

  const [formData, setFormData] = useState({
    patientId: initialPatientId,
    recordType: "GENERAL_CHECKUP",
    recordDate: new Date().toISOString().split("T")[0],
    vitals: {
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      spO2: "",
      respiratoryRate: "",
      weight: "",
      height: "",
      bloodGlucose: "",
    },
    symptoms: "",
    diagnosis: "",
    treatmentPlan: "",
    medications: [
      { name: "", dosage: "", frequency: "", duration: "" },
    ],
    notes: "",
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

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/health-records";
      if (typeFilter !== "ALL") {
        url += `?recordType=${typeFilter}`;
      }
      const res = await api.get(url);
      setRecords(res.data?.records || []);
    } catch (error) {
      console.error("Failed to load health records:", error);
      showToast("Failed to load health records", "error");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const loadPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data?.patients || []);
    } catch (error) {
      console.error("Failed to load patients for records:", error);
    }
  };

  useEffect(() => {
    loadRecords();
    loadPatients();
    if (initialPatientId) {
      setShowAddModal(true);
    }
  }, [loadRecords, initialPatientId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [name]: value },
    }));
  };

  const handleMedicationChange = (index, field, value) => {
    setFormData((prev) => {
      const newMeds = [...prev.medications];
      newMeds[index] = { ...newMeds[index], [field]: value };
      return { ...prev, medications: newMeds };
    });
  };

  const addMedicationRow = () => {
    setFormData((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "", frequency: "", duration: "" },
      ],
    }));
  };

  const removeMedicationRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientId) {
      showToast("Please choose a patient", "error");
      return;
    }

    try {
      setSaving(true);
      // Clean empty medication rows
      const validMeds = formData.medications.filter((m) => m.name.trim());

      await api.post("/health-records", {
        ...formData,
        medications: validMeds,
      });

      showToast("Health record created successfully! 📋", "success");
      setShowAddModal(false);
      setFormData({
        patientId: "",
        recordType: "GENERAL_CHECKUP",
        recordDate: new Date().toISOString().split("T")[0],
        vitals: {
          bloodPressure: "",
          heartRate: "",
          temperature: "",
          spO2: "",
          respiratoryRate: "",
          weight: "",
          height: "",
          bloodGlucose: "",
        },
        symptoms: "",
        diagnosis: "",
        treatmentPlan: "",
        medications: [{ name: "", dosage: "", frequency: "", duration: "" }],
        notes: "",
      });
      loadRecords();
    } catch (error) {
      console.error("Create health record error:", error);
      showToast(
        error.response?.data?.message || "Failed to create health record",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this health record?")) {
      return;
    }
    try {
      await api.delete(`/health-records/${id}`);
      showToast("Health record removed successfully", "success");
      setSelectedRecord(null);
      loadRecords();
    } catch (error) {
      console.error("Delete record error:", error);
      showToast("Failed to delete record", "error");
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

  const filteredRecords = records.filter((rec) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const patientName = rec.patient?.fullName?.toLowerCase() || "";
    const patientPhone = rec.patient?.phone?.toLowerCase() || "";
    const diagnosis = rec.diagnosis?.toLowerCase() || "";
    const symptoms = rec.symptoms?.toLowerCase() || "";
    return (
      patientName.includes(term) ||
      patientPhone.includes(term) ||
      diagnosis.includes(term) ||
      symptoms.includes(term)
    );
  });

  const totalRecords = records.length;
  const vitalsCount = records.filter(
    (r) => r.vitals?.bloodPressure || r.vitals?.heartRate || r.vitals?.temperature
  ).length;
  const ancCount = records.filter((r) => r.recordType === "ANTENATAL_CARE").length;
  const immunizationCount = records.filter((r) => r.recordType === "IMMUNIZATION").length;

  return (
    <div className="health-records-page">
      {/* Toast */}
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
            <Link to="/appointments" className="nav-item">
              Appointments
            </Link>
            <Link to="/health-records" className="nav-item active">
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

      {/* MAIN */}
      <main className="records-main">
        {/* HERO */}
        <div className="records-hero">
          <div className="hero-left">
            <span className="hero-eyebrow">CLINICAL DOCUMENTATION & VITALS</span>
            <h2>Patient Health Records</h2>
            <p>
              Log medical observations, vital signs, clinical diagnoses, antenatal
              progress, prescriptions, and immunization history.
            </p>
          </div>
          <button
            className="primary-action-btn"
            onClick={() => setShowAddModal(true)}
          >
            <span>+</span> Create New Health Record
          </button>
        </div>

        {/* STATS */}
        <div className="stats-row">
          <div className="record-stat-card">
            <div className="stat-icon icon-teal">📋</div>
            <div className="stat-info">
              <span className="stat-title">Total Records</span>
              <h3>{totalRecords}</h3>
            </div>
          </div>

          <div className="record-stat-card">
            <div className="stat-icon icon-blue">💓</div>
            <div className="stat-info">
              <span className="stat-title">Vitals Tracked</span>
              <h3>{vitalsCount}</h3>
            </div>
          </div>

          <div className="record-stat-card">
            <div className="stat-icon icon-purple">🤰</div>
            <div className="stat-info">
              <span className="stat-title">Antenatal Visits</span>
              <h3>{ancCount}</h3>
            </div>
          </div>

          <div className="record-stat-card">
            <div className="stat-icon icon-emerald">💉</div>
            <div className="stat-info">
              <span className="stat-title">Immunizations</span>
              <h3>{immunizationCount}</h3>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by patient name, diagnosis, symptoms..."
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
            <label>Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="GENERAL_CHECKUP">General Checkup</option>
              <option value="VITALS">Vitals Check</option>
              <option value="ANTENATAL_CARE">Antenatal Care (ANC)</option>
              <option value="IMMUNIZATION">Immunization</option>
              <option value="DIAGNOSIS">Diagnosis</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="LAB_TEST">Lab Test</option>
            </select>
          </div>
        </div>

        {/* RECORDS LIST */}
        <div className="records-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading clinical records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Health Records Found</h3>
              <p>
                {searchTerm || typeFilter !== "ALL"
                  ? "No records match the current filters."
                  : "Begin documenting patient vitals and checkups."}
              </p>
              <button
                className="secondary-btn"
                onClick={() => setShowAddModal(true)}
              >
                Add First Health Record
              </button>
            </div>
          ) : (
            <div className="records-grid">
              {filteredRecords.map((rec) => {
                const recDate = new Date(rec.recordDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                const typeLabels = {
                  GENERAL_CHECKUP: "General Checkup",
                  VITALS: "Vitals Check",
                  ANTENATAL_CARE: "Antenatal Care",
                  IMMUNIZATION: "Immunization",
                  DIAGNOSIS: "Clinical Diagnosis",
                  PRESCRIPTION: "Prescription",
                  LAB_TEST: "Lab Test",
                };

                const vitals = rec.vitals || {};

                return (
                  <div key={rec._id} className="record-card">
                    <div className="card-top">
                      <span className={`type-tag type-${rec.recordType?.toLowerCase()}`}>
                        {typeLabels[rec.recordType] || rec.recordType}
                      </span>
                      <span className="record-date">{recDate}</span>
                    </div>

                    <div className="patient-heading">
                      <h4>{rec.patient?.fullName || "Patient"}</h4>
                      <span>
                        {rec.patient?.gender} • {rec.patient?.age}y •{" "}
                        {rec.patient?.village || "Community"}
                      </span>
                    </div>

                    {/* Vitals summary badges */}
                    {(vitals.bloodPressure ||
                      vitals.heartRate ||
                      vitals.temperature ||
                      vitals.bloodGlucose ||
                      vitals.spO2) && (
                      <div className="vitals-row">
                        {vitals.bloodPressure && (
                          <span className="vital-pill">
                            BP: <strong>{vitals.bloodPressure}</strong>
                          </span>
                        )}
                        {vitals.heartRate && (
                          <span className="vital-pill">
                            HR: <strong>{vitals.heartRate} bpm</strong>
                          </span>
                        )}
                        {vitals.temperature && (
                          <span className="vital-pill">
                            Temp: <strong>{vitals.temperature}°F</strong>
                          </span>
                        )}
                        {vitals.spO2 && (
                          <span className="vital-pill">
                            SpO2: <strong>{vitals.spO2}%</strong>
                          </span>
                        )}
                        {vitals.bloodGlucose && (
                          <span className="vital-pill">
                            Sugar: <strong>{vitals.bloodGlucose} mg/dL</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {rec.diagnosis && (
                      <div className="diagnosis-preview">
                        <strong>Diagnosis:</strong> {rec.diagnosis}
                      </div>
                    )}

                    {rec.symptoms && (
                      <div className="symptoms-preview">
                        <strong>Symptoms:</strong> {rec.symptoms}
                      </div>
                    )}

                    {rec.medications?.length > 0 && (
                      <div className="meds-preview">
                        💊 {rec.medications.length} Medication(s) Prescribed
                      </div>
                    )}

                    <div className="card-footer">
                      <span className="author-text">
                        By:{" "}
                        {rec.recordedBy?.fullName ||
                          rec.recordedBy?.name ||
                          "CHW"}
                      </span>
                      <button
                        className="view-record-btn"
                        onClick={() => setSelectedRecord(rec)}
                      >
                        View Full Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* CREATE RECORD MODAL */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-card wide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Create Patient Health Record</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
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

                <div className="form-group">
                  <label>
                    Record Type <span className="req">*</span>
                  </label>
                  <select
                    name="recordType"
                    value={formData.recordType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="GENERAL_CHECKUP">General Checkup</option>
                    <option value="VITALS">Vitals Tracking</option>
                    <option value="ANTENATAL_CARE">Antenatal Care (ANC)</option>
                    <option value="IMMUNIZATION">Immunization</option>
                    <option value="DIAGNOSIS">Clinical Diagnosis</option>
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="LAB_TEST">Lab Test</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Date of Visit <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    name="recordDate"
                    value={formData.recordDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* VITALS SECTION */}
              <div className="form-section-title">
                <span>Vital Signs</span>
              </div>

              <div className="vitals-inputs-grid">
                <div className="form-group">
                  <label>Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    name="bloodPressure"
                    placeholder="e.g. 120/80"
                    value={formData.vitals.bloodPressure}
                    onChange={handleVitalChange}
                  />
                </div>

                <div className="form-group">
                  <label>Heart Rate (BPM)</label>
                  <input
                    type="number"
                    name="heartRate"
                    placeholder="e.g. 72"
                    value={formData.vitals.heartRate}
                    onChange={handleVitalChange}
                  />
                </div>

                <div className="form-group">
                  <label>Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="e.g. 98.6"
                    value={formData.vitals.temperature}
                    onChange={handleVitalChange}
                  />
                </div>

                <div className="form-group">
                  <label>Oxygen SpO2 (%)</label>
                  <input
                    type="number"
                    name="spO2"
                    placeholder="e.g. 98"
                    value={formData.vitals.spO2}
                    onChange={handleVitalChange}
                  />
                </div>

                <div className="form-group">
                  <label>Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    name="bloodGlucose"
                    placeholder="e.g. 110"
                    value={formData.vitals.bloodGlucose}
                    onChange={handleVitalChange}
                  />
                </div>

                <div className="form-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    placeholder="e.g. 62.5"
                    value={formData.vitals.weight}
                    onChange={handleVitalChange}
                  />
                </div>
              </div>

              {/* CLINICAL OBSERVATIONS */}
              <div className="form-section-title">
                <span>Clinical Notes & Diagnosis</span>
              </div>

              <div className="form-group">
                <label>Reported Symptoms</label>
                <input
                  type="text"
                  name="symptoms"
                  placeholder="e.g. Mild fever, persistent cough for 3 days, fatigue"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Clinical Diagnosis / Assessment</label>
                <input
                  type="text"
                  name="diagnosis"
                  placeholder="e.g. Upper Respiratory Tract Infection (URTI)"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Treatment Plan / Counseling</label>
                <textarea
                  name="treatmentPlan"
                  rows="2"
                  placeholder="Rest, hydration, warm saline gargle, follow-up if symptoms persist"
                  value={formData.treatmentPlan}
                  onChange={handleInputChange}
                ></textarea>
              </div>

              {/* MEDICATIONS */}
              <div className="form-section-title med-section-header">
                <span>Prescribed Medications</span>
                <button
                  type="button"
                  className="add-med-btn"
                  onClick={addMedicationRow}
                >
                  + Add Medicine
                </button>
              </div>

              {formData.medications.map((med, index) => (
                <div key={index} className="medication-row">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Paracetamol)"
                    value={med.name}
                    onChange={(e) =>
                      handleMedicationChange(index, "name", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    value={med.dosage}
                    onChange={(e) =>
                      handleMedicationChange(index, "dosage", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Frequency (1-0-1)"
                    value={med.frequency}
                    onChange={(e) =>
                      handleMedicationChange(index, "frequency", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) =>
                      handleMedicationChange(index, "duration", e.target.value)
                    }
                  />
                  {formData.medications.length > 1 && (
                    <button
                      type="button"
                      className="remove-med-btn"
                      onClick={() => removeMedicationRow(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? "Saving Record..." : "Save Health Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRecord && (
        <div className="modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div
            className="modal-card wide-modal detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Clinical Record Details</h3>
              <button className="close-btn" onClick={() => setSelectedRecord(null)}>
                ✕
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-header-card">
                <div>
                  <h4>{selectedRecord.patient?.fullName}</h4>
                  <p>
                    {selectedRecord.patient?.gender} •{" "}
                    {selectedRecord.patient?.age} Years •{" "}
                    {selectedRecord.patient?.phone}
                  </p>
                  <p className="village-badge">
                    🏡 {selectedRecord.patient?.village || "Community"}
                    {selectedRecord.patient?.district
                      ? `, ${selectedRecord.patient.district}`
                      : ""}
                  </p>
                </div>
                <div className="detail-badges">
                  <span className={`type-tag type-${selectedRecord.recordType?.toLowerCase()}`}>
                    {selectedRecord.recordType}
                  </span>
                  <span className="record-date">
                    {new Date(selectedRecord.recordDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Vitals Grid */}
              <div className="detail-section">
                <h5>Recorded Vital Signs</h5>
                <div className="vitals-display-grid">
                  <div className="vital-box">
                    <span className="vital-label">Blood Pressure</span>
                    <strong>
                      {selectedRecord.vitals?.bloodPressure || "—"}
                    </strong>
                  </div>
                  <div className="vital-box">
                    <span className="vital-label">Pulse / Heart Rate</span>
                    <strong>
                      {selectedRecord.vitals?.heartRate
                        ? `${selectedRecord.vitals.heartRate} bpm`
                        : "—"}
                    </strong>
                  </div>
                  <div className="vital-box">
                    <span className="vital-label">Temperature</span>
                    <strong>
                      {selectedRecord.vitals?.temperature
                        ? `${selectedRecord.vitals.temperature} °F`
                        : "—"}
                    </strong>
                  </div>
                  <div className="vital-box">
                    <span className="vital-label">SpO2 Oxygen</span>
                    <strong>
                      {selectedRecord.vitals?.spO2
                        ? `${selectedRecord.vitals.spO2} %`
                        : "—"}
                    </strong>
                  </div>
                  <div className="vital-box">
                    <span className="vital-label">Blood Glucose</span>
                    <strong>
                      {selectedRecord.vitals?.bloodGlucose
                        ? `${selectedRecord.vitals.bloodGlucose} mg/dL`
                        : "—"}
                    </strong>
                  </div>
                  <div className="vital-box">
                    <span className="vital-label">Weight</span>
                    <strong>
                      {selectedRecord.vitals?.weight
                        ? `${selectedRecord.vitals.weight} kg`
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Clinical Assessment */}
              <div className="detail-section">
                <h5>Clinical Assessment</h5>
                <div className="clinical-grid">
                  <div>
                    <label>Symptoms:</label>
                    <p>{selectedRecord.symptoms || "None reported"}</p>
                  </div>
                  <div>
                    <label>Diagnosis:</label>
                    <p className="diagnosis-highlight">
                      {selectedRecord.diagnosis || "General evaluation"}
                    </p>
                  </div>
                  <div>
                    <label>Treatment & Care Plan:</label>
                    <p>{selectedRecord.treatmentPlan || "Standard wellness advice"}</p>
                  </div>
                  <div>
                    <label>Recorded By:</label>
                    <p>
                      {selectedRecord.recordedBy?.fullName ||
                        selectedRecord.recordedBy?.name ||
                        "Health Worker"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medications Table */}
              {selectedRecord.medications?.length > 0 && (
                <div className="detail-section">
                  <h5>Prescribed Medications</h5>
                  <table className="meds-table">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecord.medications.map((m, idx) => (
                        <tr key={idx}>
                          <td><strong>{m.name}</strong></td>
                          <td>{m.dosage || "—"}</td>
                          <td>{m.frequency || "—"}</td>
                          <td>{m.duration || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="detail-actions">
                <button
                  className="cancel-action-btn"
                  onClick={() => handleDeleteRecord(selectedRecord._id)}
                >
                  Delete Record
                </button>
                <button
                  className="reopen-btn"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
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

export default HealthRecords;
