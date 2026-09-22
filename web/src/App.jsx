import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PatientManagement from "./pages/PatientManagement";
import Appointments from "./pages/Appointments";
import HealthRecords from "./pages/HealthRecords";

import "./App.css";

/* =====================================================
   PROTECTED ROUTE
   Uses JWT token presence for authentication check
===================================================== */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =====================================================
   APPLICATION CONTENT
===================================================== */

function AppContent() {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  /* Keep authentication state synchronized */
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    window.addEventListener("storage", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
    };
  }, []);

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = (userData, token) => {
    // Store JWT token
    if (token) {
      localStorage.setItem("token", token);
    }

    // Store user info
    if (userData) {
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );
    }

    // Keep isLoggedIn for backwards compat
    localStorage.setItem("isLoggedIn", "true");

    setIsLoggedIn(true);

    navigate("/dashboard", {
      replace: true,
    });
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);

    navigate("/login", {
      replace: true,
    });
  };

  /* =====================================================
     REGISTER COMPLETE
  ===================================================== */

  const handleRegisterComplete = () => {
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <Routes>

      {/* ===============================================
          HOME
      =============================================== */}

      <Route
        path="/"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* ===============================================
          LOGIN
      =============================================== */}

      <Route
        path="/login"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} />
          )
        }
      />

      {/* ===============================================
          CREATE ACCOUNT / REGISTER
      =============================================== */}

      <Route
        path="/register"
        element={
          isLoggedIn ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Register
              onLogin={() => navigate("/login")}
              onRegisterComplete={
                handleRegisterComplete
              }
            />
          )
        }
      />

      {/* ===============================================
          DASHBOARD
      =============================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* ===============================================
          PATIENT MANAGEMENT
      =============================================== */}

      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <PatientManagement onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* Alternative URL */}
      <Route
        path="/patient-management"
        element={
          <ProtectedRoute>
            <PatientManagement onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* ===============================================
          APPOINTMENTS MANAGEMENT
      =============================================== */}

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* ===============================================
          HEALTH RECORDS
      =============================================== */}

      <Route
        path="/health-records"
        element={
          <ProtectedRoute>
            <HealthRecords onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      {/* ===============================================
          UNKNOWN ROUTE
      =============================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to={
              isLoggedIn
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

    </Routes>
  );
}

/* =====================================================
   APP
===================================================== */

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;