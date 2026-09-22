import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ChangePasswordModal from "../components/ChangePasswordModal";

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [healthRecordsCount, setHealthRecordsCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Read actual logged-in user from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const userName =
    user.fullName ||
    user.name ||
    "Health Worker";

  const userRole = user.role || "WORKER";

  const firstLetter =
    userName.charAt(0).toUpperCase();

  const loadDashboardData = async () => {
    setLoadingPatients(true);

    try {
      const [patientsRes, appRes, recRes] = await Promise.allSettled([
        api.get("/patients"),
        api.get("/appointments"),
        api.get("/health-records"),
      ]);

      if (patientsRes.status === "fulfilled") {
        setPatients(patientsRes.value.data?.patients || []);
      }
      if (appRes.status === "fulfilled") {
        setAppointmentsCount(appRes.value.data?.appointments?.length || 0);
      }
      if (recRes.status === "fulfilled") {
        setHealthRecordsCount(recRes.value.data?.records?.length || 0);
      }
    } catch (error) {
      console.error(
        "Failed to load dashboard data:",
        error
      );
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleDataUpdated = () => {
      loadDashboardData();
    };

    window.addEventListener(
      "patientsUpdated",
      handleDataUpdated
    );

    return () => {
      window.removeEventListener(
        "patientsUpdated",
        handleDataUpdated
      );
    };
  }, []);

  const totalPatients = patients.length;

  const activePatients =
    patients.filter(
      (patient) =>
        !patient.status ||
        String(patient.status).toUpperCase() ===
          "ACTIVE"
    ).length;

  const femalePatients =
    patients.filter(
      (p) => String(p.gender).toUpperCase() === "FEMALE"
    ).length;

  const malePatients =
    patients.filter(
      (p) => String(p.gender).toUpperCase() === "MALE"
    ).length;

  const services = [
    {
      icon: "👥",
      title: "Patient Management",
      description:
        "Register, search and manage community patient information.",
      status: "Available",
      link: "/patients",
      available: true,
      className: "service-patients",
    },
    {
      icon: "🗓️",
      title: "Appointments",
      description:
        "Schedule appointments, manage follow-ups and organize community visits.",
      status: "Available",
      link: "/appointments",
      available: true,
      className: "service-appointments",
    },
    {
      icon: "📋",
      title: "Health Records",
      description:
        "Maintain organized clinical records, vitals, prescriptions and health history.",
      status: "Available",
      link: "/health-records",
      available: true,
      className: "service-records",
    },
    {
      icon: "🤖",
      title: "AI Health Assistant",
      description:
        "Intelligent healthcare information and decision-support assistance.",
      status: "Coming Soon",
      link: "#",
      available: false,
      className: "service-ai",
    },
  ];

  const logout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <header className="dashboard-header">

        <div className="header-inner">

          <Link
            to="/dashboard"
            className="brand"
          >

            <img
              src="/logo.png"
              alt="Community Health Worker"
              className="brand-logo"
            />

            <div className="brand-text">
              <h1>
                Community Health Worker
              </h1>
              <p>
                ASSISTANCE PLATFORM
              </p>
            </div>

          </Link>

          <div className="user-area">

            <div className="user-info">
              <strong>
                {userName}
              </strong>

              <span>
                {userRole}
              </span>
            </div>

            <div className="user-avatar">
              {firstLetter}
            </div>

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

            <button
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <main className="dashboard-main">

        {/* HERO */}
        <section className="welcome-section">

          <div className="welcome-content">

            <span className="welcome-label">
              Welcome back 👋
            </span>

            <h2>
              {userName}
            </h2>

            <p>
              Your community healthcare
              workspace is ready.
            </p>

            <div className="account-status">
              <span className="status-dot"></span>
              Account active
              <span className="status-divider"></span>
              {userRole}
            </div>

          </div>

          <div className="hero-avatar">
            {firstLetter}
          </div>

          <div className="hero-decoration hero-circle-one"></div>
          <div className="hero-decoration hero-circle-two"></div>

        </section>

        {/* STATISTICS */}
        <section className="stats-grid">

          <div
            className="stat-card stat-patients"
            onClick={() =>
              navigate("/patients")
            }
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon">
              👥
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Total Patients
              </span>

              <strong className="stat-number">
                {loadingPatients
                  ? "..."
                  : totalPatients}
              </strong>

              <span className="stat-description">
                {activePatients} active patient
                {activePatients !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            <span className="stat-arrow">
              →
            </span>

          </div>

          <div
            className="stat-card stat-appointments"
            onClick={() => navigate("/appointments")}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon">
              🗓️
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Appointments
              </span>

              <strong className="stat-number">
                {appointmentsCount}
              </strong>

              <span className="stat-description">
                Scheduled & visits
              </span>

            </div>

            <span className="stat-arrow">
              →
            </span>

          </div>

          <div
            className="stat-card stat-records"
            onClick={() => navigate("/health-records")}
            style={{ cursor: "pointer" }}
          >

            <div className="stat-icon">
              📋
            </div>

            <div className="stat-content">

              <span className="stat-label">
                Health Records
              </span>

              <strong className="stat-number">
                {healthRecordsCount}
              </strong>

              <span className="stat-description">
                Clinical records & vitals
              </span>

            </div>

            <span className="stat-arrow">
              →
            </span>

          </div>

        </section>

        {/* SERVICES */}
        <section className="services-section">

          <div className="section-heading">

            <div>

              <span className="section-eyebrow">
                YOUR WORKSPACE
              </span>

              <h2>
                Platform Services
              </h2>

              <p>
                Tools designed to support
                community healthcare workers.
              </p>

            </div>

            <span className="phase-badge">
              PHASE 1
            </span>

          </div>

          <div className="services-grid">

            {services.map(
              (service, index) => {

                const content = (
                  <>
                    <div
                      className={`service-icon ${service.className}`}
                    >
                      {service.icon}
                    </div>

                    <div className="service-top">

                      <span
                        className={
                          service.available
                            ? "service-status available"
                            : "service-status coming"
                        }
                      >
                        {service.status}
                      </span>

                    </div>

                    <h3>
                      {service.title}
                    </h3>

                    <p>
                      {service.description}
                    </p>

                    <div className="service-footer">

                      <span>
                        {service.available
                          ? "Open patient records"
                          : "Coming soon"}
                      </span>

                      <span className="arrow">
                        →
                      </span>

                    </div>
                  </>
                );

                if (service.available) {
                  return (
                    <Link
                      key={index}
                      to={service.link}
                      className="service-card"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={index}
                    className="service-card disabled-service"
                  >
                    {content}
                  </div>
                );
              }
            )}

          </div>

        </section>

      </main>

      <footer className="dashboard-footer">

        <span>
          © 2026 Community Health Worker
          Assistance Platform
        </span>

        <div className="footer-links">
          <span>
            Community Focused
          </span>

          <span>•</span>

          <span>
            Accessible
          </span>

          <span>•</span>

          <span>
            Secure
          </span>
        </div>

      </footer>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

    </div>
  );
};

export default Dashboard;