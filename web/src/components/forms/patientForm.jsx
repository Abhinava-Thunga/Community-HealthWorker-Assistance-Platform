import { useEffect, useState } from "react";
import api from "../../services/api";

const initialForm = {
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

  emergencyContactName: "",
  emergencyContactPhone: "",

  bloodGroup: "",
  allergies: "",
  existingConditions: "",
};

function PatientForm({ patient, onSaved, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditing = !!patient;

  // ----------------------------------------
  // Load existing patient into form
  // ----------------------------------------

  useEffect(() => {
    if (patient) {
      setForm({
        fullName: patient.fullName || "",
        age: patient.age ?? "",
        gender: patient.gender || "",
        phone: patient.phone || "",
        email: patient.email || "",

        address: patient.address || "",
        village: patient.village || "",
        district: patient.district || "",
        state: patient.state || "",
        pincode: patient.pincode || "",

        emergencyContactName:
          patient.emergencyContactName || "",

        emergencyContactPhone:
          patient.emergencyContactPhone || "",

        bloodGroup: patient.bloodGroup || "",
        allergies: patient.allergies || "",
        existingConditions:
          patient.existingConditions || "",
      });
    } else {
      setForm(initialForm);
    }

    setError("");
    setSuccess("");
  }, [patient]);

  // ----------------------------------------
  // Handle input
  // ----------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ----------------------------------------
  // Submit
  // ----------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation

    if (
      !form.fullName.trim() ||
      !form.age ||
      !form.gender ||
      !form.phone.trim()
    ) {
      setError(
        "Full name, age, gender and phone number are required."
      );
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
        ...form,
        age: Number(form.age),
      };

      let response;

      if (isEditing) {
        response = await api.put(
          `/patients/${patient._id}`,
          payload,
          config
        );
      } else {
        response = await api.post(
          "/patients",
          payload,
          config
        );
      }

      setSuccess(
        response.data.message ||
          (isEditing
            ? "Patient updated successfully."
            : "Patient registered successfully.")
      );

      setTimeout(() => {
        onSaved();
      }, 700);

    } catch (err) {
      console.error("Patient save error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to save patient information."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-form">

      {/* ================================
          FORM HEADER
      ================================= */}

      <div className="patient-form-header">

        <div>

          <span className="form-eyebrow">
            PATIENT RECORD
          </span>

          <h2>
            {isEditing
              ? "Edit Patient"
              : "Register New Patient"}
          </h2>

          <p>
            {isEditing
              ? "Update the patient's information below."
              : "Enter the patient's information to create a new record."}
          </p>

        </div>

        <button
          type="button"
          className="form-close-btn"
          onClick={onCancel}
        >
          ×
        </button>

      </div>

      {/* ================================
          ERROR
      ================================= */}

      {error && (
        <div className="form-error">
          <span>!</span>
          {error}
        </div>
      )}

      {/* ================================
          SUCCESS
      ================================= */}

      {success && (
        <div className="form-success">
          <span>✓</span>
          {success}
        </div>
      )}

      {/* ================================
          FORM
      ================================= */}

      <form onSubmit={handleSubmit}>

        {/* BASIC INFORMATION */}

        <div className="form-section">

          <div className="form-section-title">
            <span className="form-section-number">
              01
            </span>

            <div>
              <h3>Basic Information</h3>
              <p>Patient's primary details</p>
            </div>
          </div>

          <div className="form-grid">

            <div className="form-field full">

              <label>
                Full Name <span>*</span>
              </label>

              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter patient's full name"
                required
              />

            </div>

            <div className="form-field">

              <label>
                Age <span>*</span>
              </label>

              <input
                type="number"
                name="age"
                min="0"
                max="120"
                value={form.age}
                onChange={handleChange}
                placeholder="Age"
                required
              />

            </div>

            <div className="form-field">

              <label>
                Gender <span>*</span>
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select gender
                </option>

                <option value="MALE">
                  Male
                </option>

                <option value="FEMALE">
                  Female
                </option>

                <option value="OTHER">
                  Other
                </option>

              </select>

            </div>

            <div className="form-field">

              <label>
                Phone Number <span>*</span>
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

            </div>

            <div className="form-field">

              <label>
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="patient@example.com"
              />

            </div>

          </div>

        </div>

        {/* ADDRESS */}

        <div className="form-section">

          <div className="form-section-title">

            <span className="form-section-number">
              02
            </span>

            <div>
              <h3>Address</h3>
              <p>Patient's location information</p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-field full">

              <label>
                Address
              </label>

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House number, street and locality"
                rows="2"
              />

            </div>

            <div className="form-field">

              <label>
                Village
              </label>

              <input
                type="text"
                name="village"
                value={form.village}
                onChange={handleChange}
                placeholder="Village"
              />

            </div>

            <div className="form-field">

              <label>
                District
              </label>

              <input
                type="text"
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="District"
              />

            </div>

            <div className="form-field">

              <label>
                State
              </label>

              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="State"
              />

            </div>

            <div className="form-field">

              <label>
                Pincode
              </label>

              <input
                type="text"
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength="6"
              />

            </div>

          </div>

        </div>

        {/* EMERGENCY CONTACT */}

        <div className="form-section">

          <div className="form-section-title">

            <span className="form-section-number">
              03
            </span>

            <div>
              <h3>Emergency Contact</h3>
              <p>Person to contact in an emergency</p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label>
                Contact Name
              </label>

              <input
                type="text"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Emergency contact name"
              />

            </div>

            <div className="form-field">

              <label>
                Contact Phone
              </label>

              <input
                type="tel"
                name="emergencyContactPhone"
                value={form.emergencyContactPhone}
                onChange={handleChange}
                placeholder="Emergency phone number"
              />

            </div>

          </div>

        </div>

        {/* HEALTH INFORMATION */}

        <div className="form-section">

          <div className="form-section-title">

            <span className="form-section-number">
              04
            </span>

            <div>
              <h3>Health Information</h3>
              <p>Important medical information</p>
            </div>

          </div>

          <div className="form-grid">

            <div className="form-field">

              <label>
                Blood Group
              </label>

              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
              >
                <option value="">
                  Select blood group
                </option>

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

              <label>
                Allergies
              </label>

              <input
                type="text"
                name="allergies"
                value={form.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Dust"
              />

            </div>

            <div className="form-field full">

              <label>
                Existing Conditions
              </label>

              <textarea
                name="existingConditions"
                value={form.existingConditions}
                onChange={handleChange}
                placeholder="Diabetes, hypertension or other existing conditions..."
                rows="3"
              />

            </div>

          </div>

        </div>

        {/* ACTIONS */}

        <div className="patient-form-actions">

          <button
            type="button"
            className="form-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="form-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                {isEditing
                  ? "Save Changes"
                  : "Register Patient"}
                <span>→</span>
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  );
}

export default PatientForm;