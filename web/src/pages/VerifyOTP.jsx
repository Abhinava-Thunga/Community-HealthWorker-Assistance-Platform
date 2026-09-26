import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function VerifyOTP({ email, onVerified, onBack }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [resending, setResending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ============================================================
  // VERIFY OTP
  // ============================================================
  const handleVerify = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setInfoMessage("");

    const cleanOTP = otp.trim();

    if (cleanOTP.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setLoadingText("Verifying OTP...");

      const response = await api.post("/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: cleanOTP,
      });

      console.log("OTP verification response:", response.data);

      if (response.data?.success) {
        setLoadingText("Creating account in database...");

        // Call onVerified with the verification token
        await onVerified(response.data.verificationToken);

        // Show pending admin approval success screen
        setIsSuccess(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    } catch (error) {
      console.error("OTP verification error:", error);

      const msg =
        error.response?.data?.message ||
        error.message ||
        "Invalid OTP";

      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================
  const handleResend = async () => {
    setErrorMessage("");
    setInfoMessage("");

    try {
      setResending(true);

      const response = await api.post("/auth/send-otp", {
        email: email.trim().toLowerCase(),
      });

      setInfoMessage(
        response.data?.message ||
          "A new OTP has been sent to your email."
      );

      setOtp("");
    } catch (error) {
      console.error("Resend OTP error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  // ============================================================
  // SUCCESS SCREEN (PENDING ADMIN APPROVAL)
  // ============================================================
  if (isSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: "520px" }}>
          <div className="brand">
            <div
              className="brand-icon"
              style={{ background: "#e0f7ea", color: "#198754", fontSize: "32px" }}
            >
              ✓
            </div>
            <h1>Account Created!</h1>
            <p>Community Health Worker Platform</p>
          </div>

          <div
            style={{
              background: "#fff9e6",
              border: "1px solid #ffeeba",
              borderRadius: "16px",
              padding: "20px",
              margin: "20px 0",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                color: "#856404",
                fontSize: "17px",
                margin: "0 0 10px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ⏳ Pending Administrator Approval
            </h3>
            <p
              style={{
                color: "#665103",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: "0 0 10px",
              }}
            >
              Your email has been verified and your account has been registered in the system.
            </p>
            <p
              style={{
                color: "#665103",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              For security, an administrator must approve your account before you can log in. You will receive access once your status is set to <strong>ACTIVE</strong>.
            </p>
          </div>

          <p style={{ color: "#708893", fontSize: "14px", marginBottom: "20px" }}>
            Redirecting to sign in page in a moment...
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/login", { replace: true })}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // OTP INPUT SCREEN
  // ============================================================
  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* BRAND */}
        <div className="brand">
          <div className="brand-icon">✉️</div>
          <h1>Verify Email</h1>
          <p>Community Health Worker Platform</p>
        </div>

        {/* TITLE */}
        <h2>Enter OTP</h2>
        <p className="subtitle">
          We've sent a 6-digit verification code to
          <br />
          <strong>{email}</strong>
        </p>

        {/* FORM */}
        <form onSubmit={handleVerify}>
          <label htmlFor="otp">Verification Code</label>

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
            disabled={loading}
            required
          />

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div className="error-message">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* INFO MESSAGE */}
          {infoMessage && (
            <div
              style={{
                padding: "12px 14px",
                margin: "12px 0 0",
                borderRadius: "12px",
                background: "#e8f7f2",
                border: "1px solid #b7e7da",
                color: "#087462",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              ✓ {infoMessage}
            </div>
          )}

          {/* VERIFY BUTTON */}
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? loadingText || "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* RESEND */}
        <button
          type="button"
          className="resend-button"
          onClick={handleResend}
          disabled={resending || loading}
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
            disabled={loading}
          >
            ← Change email / Back to registration
          </button>
        )}
      </div>
    </div>
  );
}

export default VerifyOTP;