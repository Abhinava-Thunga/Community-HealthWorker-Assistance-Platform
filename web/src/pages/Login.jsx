import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

import "./Login.css";

const Login = ({ onLogin }) => {

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);

      const token =
        response.data?.token ||
        response.data?.accessToken;

      const user =
        response.data?.user ||
        response.data?.data?.user;

      if (!token) {
        console.error("Backend did not return a JWT token:", response.data);

        setError(
          "Login succeeded but the server did not return an authentication token."
        );

        return;
      }

      // Use the onLogin callback from App.jsx
      // This stores token + user and navigates to dashboard
      if (onLogin) {
        onLogin(user, token);
      }

    } catch (err) {
      console.error("Login error:", err);

      let message = "Unable to sign in. Please try again.";

      if (err.response) {
        console.error("Backend status:", err.response.status);
        console.error("Backend response:", err.response.data);

        if (err.response.status === 401) {
          message = "Invalid email or password.";
        } else if (err.response.status === 403) {
          message =
            "Your account is not authorized or has not been verified.";
        } else if (err.response.status === 404) {
          message =
            "Login API was not found. Check the backend authentication route.";
        } else if (err.response.data?.message) {
          message = err.response.data.message;
        } else if (err.response.data?.error) {
          message = err.response.data.error;
        }
      } else if (err.request) {
        message =
          "Cannot connect to the backend. Make sure the server is running on port 5000.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">

      {/* LEFT SIDE */}
      <div className="auth-left">

        <div className="auth-brand">
          <img
            src="/logo.png"
            alt="Community Health Worker"
            className="auth-logo"
          />
        </div>

        <div className="auth-intro">
          <span className="auth-eyebrow">
            COMMUNITY HEALTHCARE
          </span>

          <h1>
            Empowering healthcare
            <br />
            at the community
            <br />
            level.
          </h1>

          <div className="auth-features">

            <div className="auth-feature">
              <span>✓</span>
              <p>Secure patient management</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Simple and accessible workflow</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Community-focused healthcare</p>
            </div>

          </div>
        </div>

        <div className="auth-footer">
          © 2026 Community Health Worker Assistance Platform
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">

        <div className="login-card">

          <span className="login-eyebrow">
            WELCOME BACK
          </span>

          <h2>
            Sign in to your account
          </h2>

          <p className="login-subtitle">
            Access your healthcare workspace
          </p>

          <form onSubmit={handleSubmit}>

            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="email">
                Email address
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
                  disabled={loading}
                  required
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

              </div>

            </div>

            {/* ERROR */}
            {error && (
              <div className="login-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          {/* REGISTER */}
          <div className="register-prompt">
            <span>Don't have an account?</span>

            <Link to="/register">
              Create account
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;