import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import VerifyOTP from "./VerifyOTP";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    role: "WORKER",
    workerId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Controls OTP screen
  const [showOTP, setShowOTP] = useState(false);

  // Stores verification token returned by backend
  const [verificationToken, setVerificationToken] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  // ============================================================
  // STEP 1: VALIDATE FORM + SEND OTP
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const {
      fullName,
      workerId,
      email,
      phone,
      password,
      confirmPassword,
    } = formData;

    // Basic validation
    if (
      !fullName.trim() ||
      !workerId.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields including your ASHA / Worker ID.");
      return;
    }

    // Password validation
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      // ========================================================
      // SEND OTP
      // ========================================================

      const response = await api.post("/auth/send-otp", {
        email: email.trim().toLowerCase(),
      });

      console.log("OTP response:", response.data);

      setSuccess(
        response.data?.message ||
          "OTP sent successfully. Please check your email."
      );

      // Show OTP screen
      setShowOTP(true);

    } catch (error) {
      console.error("Send OTP error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // STEP 2: OTP VERIFIED
  // ============================================================

  const handleOTPVerified = async (token) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      console.log("Verification token received:", token);
      setVerificationToken(token);

      // ========================================================
      // STEP 3: REGISTER USER IN DATABASE
      // ========================================================
      const response = await api.post("/auth/register", {
        fullName: formData.fullName.trim(),
        role: formData.role || "WORKER",
        workerId: formData.workerId.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        verificationToken: token,
      });

      console.log("Registration response:", response.data);

      if (response.data?.success) {
        setSuccess(
          "Account created successfully! Pending administrator approval."
        );
        return response.data;
      }
    } catch (error) {
      console.error("Registration error:", error);
      const message =
        error.response?.data?.message ||
        "Unable to create account. Please try again.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OTP SCREEN
  // ============================================================

  if (showOTP) {
    return (
      <VerifyOTP
        email={formData.email}
        onVerified={handleOTPVerified}
        onBack={() => {
          setShowOTP(false);
          setError("");
          setSuccess("");
        }}
      />
    );
  }

  // ============================================================
  // REGISTER SCREEN
  // ============================================================

  return (
    <div className="auth-page register-page">

      {/* =====================================================
          LEFT SIDE
      ===================================================== */}

      <section className="auth-brand-section">

        <div className="auth-brand-content">

          <img
            src="/logo.png"
            alt="Community Health Worker"
            className="auth-logo"
          />

          <h1>
            Community Health Worker
          </h1>

          <p className="auth-brand-subtitle">
            ASSISTANCE PLATFORM
          </p>

          <div className="auth-benefits">

            <div className="benefit-item">
              <span>✓</span>
              <p>Secure patient management</p>
            </div>

            <div className="benefit-item">
              <span>✓</span>
              <p>Simple and accessible workflow</p>
            </div>

            <div className="benefit-item">
              <span>✓</span>
              <p>Community-focused healthcare</p>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          REGISTER FORM
      ===================================================== */}

      <section className="auth-form-section">

        <div className="auth-form-card">

          <span className="auth-eyebrow">
            COMMUNITY HEALTHCARE
          </span>

          <h2>
            Create your account
          </h2>

          <p className="auth-description">
            Join the Community Health Worker Assistance Platform.
          </p>

          <form onSubmit={handleSubmit}>

            {/* FULL NAME */}

            <div className="form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />

              </div>

            </div>

            {/* ROLE SELECTION */}

            <div className="form-group">

              <label htmlFor="role">
                Registering As (Role) <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🛡️
                </span>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: "0.95rem",
                    color: "#1e293b",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: "0.2rem 0",
                  }}
                >
                  <option value="WORKER">Community Health Worker (ASHA / ANM / Volunteer)</option>
                  <option value="ADMIN">Health Administrator / Officer (PHC / District)</option>
                </select>

              </div>

            </div>

            {/* ASHA / WORKER ID */}

            <div className="form-group">

              <label htmlFor="workerId">
                {formData.role === "ADMIN" ? "Administrator Employee ID" : "ASHA Worker ID / Field ID"}{" "}
                <span style={{ color: "#ef4444" }}>*</span>
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🪪
                </span>

                <input
                  id="workerId"
                  type="text"
                  name="workerId"
                  placeholder={
                    formData.role === "ADMIN"
                      ? "e.g. ADMIN-001 or EMP-2026"
                      : "e.g. ASHA-1042 or ANM-305"
                  }
                  value={formData.workerId}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>

            </div>

            {/* PHONE */}

            <div className="form-group">

              <label htmlFor="phone">
                Phone Number
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  📱
                </span>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔐
                </span>

                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="auth-message error-message">
                ⚠️ {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="auth-message success-message">
                ✓ {success}
              </div>
            )}

            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >

              {loading
                ? "Sending OTP..."
                : "Create Account"}

              {!loading && (
                <span>→</span>
              )}

            </button>

          </form>

          {/* LOGIN */}

          <div className="auth-switch">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in
            </Link>

          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="auth-footer">
        © 2026 Community Health Worker Assistance Platform
      </footer>

    </div>
  );
};

export default Register;