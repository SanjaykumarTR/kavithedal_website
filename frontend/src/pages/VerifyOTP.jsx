import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";

export default function VerifyOTP() {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ otp: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    // Get stored admin info
    const storedId = localStorage.getItem("pending_admin_id");
    const storedEmail = localStorage.getItem("pending_admin_email");
    
    if (!storedId || !storedEmail) {
      navigate("/login");
      return;
    }
    
    // Store as string (UUID)
    setAdminId(storedId);
    setAdminEmail(storedEmail);
    
    // Check for development OTP
    const devOTP = localStorage.getItem("dev_otp");
    if (devOTP) {
      console.log("Development OTP:", devOTP);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.otp) {
      setError(language === "en" ? "Please enter the OTP" : "OTP ஐ உள்ளிடவும்");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/verify-otp/", {
        admin_id: adminId,
        otp: form.otp,
      });
      
      const data = res.data;
      
      if (data.status === "ADMIN_LOGIN_SUCCESS") {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("auth_user", JSON.stringify({ email: adminEmail, role: data.role }));
        localStorage.setItem("admin_user", JSON.stringify({ email: adminEmail, role: data.role }));
        
        // Clean up
        localStorage.removeItem("pending_admin_id");
        localStorage.removeItem("pending_admin_email");
        localStorage.removeItem("dev_otp");
        
        // Force page reload to ensure AuthContext re-reads from localStorage
        window.location.href = "/admin/dashboard";
        return;
      }
      
      setError(data.message || (language === "en" ? "Invalid OTP" : "தவறான OTP"));
      
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        (language === "en" ? "Invalid OTP. Please try again." : "தவறான OTP. மீண்டும் முயற்சிக்கவும்.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // For now, redirect back to login to get new OTP
    localStorage.removeItem("pending_admin_id");
    localStorage.removeItem("pending_admin_email");
    localStorage.removeItem("dev_otp");
    navigate("/login");
  };

  if (!adminId) {
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 420 }}>
        <div className="login-card-glow"></div>

        <h2 className="login-title">
          {language === "en" ? "Verify OTP" : "OTP உறுதிப்படுத்து"}
        </h2>
        <p style={{ textAlign: "center", marginBottom: 20, color: "#666" }}>
          {language === "en"
            ? `Enter the OTP sent to ${adminEmail}`
            : `${adminEmail} க்கு அனுப்பப்பட்ட OTP ஐ உள்ளிடவும்`}
        </p>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input
              type="text"
              name="otp"
              placeholder={language === "en" ? "Enter 6-digit OTP" : "6 இலக்க OTP ஐ உள்ளிடவும்"}
              value={form.otp}
              onChange={handleChange}
              maxLength={6}
              className="modern-input"
              style={{ textAlign: "center", letterSpacing: 8, fontSize: 18 }}
            />
          </div>

          <button type="submit" disabled={loading} className="modern-btn">
            {loading
              ? language === "en"
                ? "Verifying..."
                : "உறுதிப்படுத்துகிறது..."
              : language === "en"
              ? "Verify OTP"
              : "OTP உறுதிப்படுத்து"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending}
            style={{
              background: "none",
              border: "none",
              color: "#4a90d9",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {resending
              ? language === "en"
                ? "Sending..."
                : "அனுப்புகிறது..."
              : language === "en"
              ? "Resend OTP"
              : "OTP மீண்டும் அனுப்பு"}
          </button>
        </p>

        <p style={{ textAlign: "center", marginTop: 15 }}>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("pending_admin_id");
              localStorage.removeItem("pending_admin_email");
              localStorage.removeItem("dev_otp");
              navigate("/login");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#666",
              cursor: "pointer",
            }}
          >
            ← {language === "en" ? "Back to Login" : "உள்நுழைவுக்கு திரும்பு"}
          </button>
        </p>
      </div>
    </div>
  );
}
