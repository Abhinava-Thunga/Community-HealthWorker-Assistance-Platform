import { useState } from "react";
import api from "../services/api";

function VerifyOTP({ email, onVerified, onBack }) {

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerify = async (e) => {
    e.preventDefault();

    setMessage("");

    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    try {

      setLoading(true);

      const response = await api.post(
        "/auth/verify-otp",
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }
      );

      console.log("OTP verification response:", response.data);

      if (response.data?.success) {

        // Send verification token back to Register.jsx
        onVerified(
          response.data.verificationToken
        );
      }

    } catch (error) {

      console.error("OTP verification error:", error);

      setMessage(
        error.response?.data?.message ||
          "Invalid or expired OTP."
      );

    } finally {

      setLoading(false);

    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResend = async () => {

    setMessage("");

    try {

      setResending(true);

      const response = await api.post(
        "/auth/send-otp",
        {
          email: email.trim().toLowerCase(),
        }
      );

      setMessage(
        response.data?.message ||
          "A new OTP has been sent to your email."
      );

      setOtp("");

    } catch (error) {

      console.error("Resend OTP error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to resend OTP."
      );

    } finally {

      setResending(false);

    }
  };

  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            ✉️
          </div>

          <h1>
            Verify Email
          </h1>

          <p>
            Community Health Worker Platform
          </p>

        </div>

        {/* TITLE */}

        <h2>
          Enter OTP
        </h2>

        <p className="subtitle">

          We've sent a 6-digit verification code to

          <br />

          <strong>
            {email}
          </strong>

        </p>

        {/* FORM */}

        <form onSubmit={handleVerify}>

          <label htmlFor="otp">
            Verification Code
          </label>

          <input
            id="otp"
            className="otp-input"
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(
                e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6)
              )
            }
            autoFocus
            required
          />

          {/* MESSAGE */}

          {message && (
            <div className="error-message">
              {message}
            </div>
          )}

          {/* VERIFY */}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >

            {loading
              ? "Verifying..."
              : "Verify OTP"}

          </button>

        </form>

        {/* RESEND */}

        <button
          type="button"
          className="resend-button"
          onClick={handleResend}
          disabled={resending}
        >

          {resending
            ? "Sending..."
            : "Didn't receive OTP? Resend"}

        </button>

        {/* BACK */}

        {onBack && (
          <button
            type="button"
            className="back-button"
            onClick={onBack}
          >
            ← Change email
          </button>
        )}

      </div>

    </div>
  );
}

export default VerifyOTP;