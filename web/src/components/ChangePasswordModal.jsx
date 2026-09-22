import React, { useState } from "react";
import api from "../services/api";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }

    if (!newPassword) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password cannot be identical to current password");
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/users/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setSuccess(res.data?.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Change password error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please verify current password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pwd-modal-backdrop" onClick={onClose}>
      <div
        className="pwd-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pwd-modal-header">
          <div className="header-title">
            <span className="pwd-icon">🔐</span>
            <div>
              <h3>Change Password</h3>
              <p>Update your credentials for secure platform access</p>
            </div>
          </div>
          <button className="pwd-close-btn" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>

        {error && (
          <div className="pwd-alert alert-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="pwd-alert alert-success">
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="pwd-form">
          <div className="pwd-form-group">
            <label>Current Password</label>
            <div className="pwd-input-wrapper">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-eye-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex="-1"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="pwd-form-group">
            <label>New Password</label>
            <div className="pwd-input-wrapper">
              <input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-eye-btn"
                onClick={() => setShowNew(!showNew)}
                tabIndex="-1"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="pwd-form-group">
            <label>Confirm New Password</label>
            <div className="pwd-input-wrapper">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-eye-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="pwd-hints">
            <small>• Minimum 6 characters required</small>
            <small>• Keep your password private and secure</small>
          </div>

          <div className="pwd-modal-actions">
            <button
              type="button"
              className="pwd-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pwd-submit-btn"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
