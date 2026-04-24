import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { language } = useContext(LanguageContext);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setError(language === "en" ? "Please fill in all fields." : "அனைத்து புலங்களையும் நிரப்பவும்.");
      return;
    }
    if (isRegister && !form.name) {
      setError(language === "en" ? "Please enter your name." : "உங்கள் பெயரை உள்ளிடவும்.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const username = form.name || form.email.split("@")[0];
        const { redirect } = await register(username, form.email, form.password);
        navigate(redirect || "/");
      } else {
        try {
          const userData = await login(form.email, form.password);
          // Redirect admins to dashboard, regular users to homepage
          if (userData.role === "admin" || userData.role === "superadmin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/");
          }
        } catch (err) {
          if (err.message === "OTP_REQUIRED") {
            navigate("/verify-otp");
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      let msg;
      if (!err.response) {
        msg = language === "en"
          ? "Cannot connect to server. Please try again."
          : "சேவையகத்துடன் இணைக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.";
      } else {
        const d = err.response.data;
        msg =
          d?.detail ||
          d?.message ||
          d?.non_field_errors?.[0] ||
          d?.email?.[0] ||
          d?.password?.[0] ||
          d?.username?.[0] ||
          (language === "en" ? "Invalid credentials. Please try again." : "தவறான நற்சான்றிதழ்கள். மீண்டும் முயற்சிக்கவும்.");
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Floating Decorations */}
      <div className="login-decoration login-decoration-1">
        <div className="floating-circle"></div>
      </div>
      <div className="login-decoration login-decoration-2">
        <span className="floating-star">✦</span>
      </div>
      <div className="login-decoration login-decoration-3">
        <div className="floating-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className="login-card">
        <div className="login-card-glow"></div>

        <h2 className="login-title">
          {isRegister
            ? language === "en" ? "Create Account" : "கணக்கை உருவாக்கு"
            : language === "en" ? "Login" : "உள்நுழை"}
        </h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="input-group">
              <input
                type="text"
                name="name"
                placeholder={language === "en" ? "Full Name" : "முழு பெயர்"}
                value={form.name}
                onChange={handleChange}
                className="modern-input"
              />
            </div>
          )}
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder={language === "en" ? "Email" : "மின்னஞ்சல்"}
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              className="modern-input"
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder={language === "en" ? "Password" : "கடவுச்சொல்"}
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              className="modern-input"
            />
          </div>

          <button type="submit" disabled={loading} className="modern-btn">
            {loading
              ? (language === "en" ? "Please wait..." : "காத்திருக்கவும்...")
              : isRegister
                ? language === "en" ? "Register" : "பதிவு செய்"
                : language === "en" ? "Login" : "உள்நுழை"}
          </button>
        </form>

        <p className="toggle-auth">
          {isRegister ? (
            <>
              {language === "en" ? "Already have an account? " : "ஏற்கனவே கணக்கு உள்ளதா? "}
              <span className="toggle-link login-link" onClick={() => setIsRegister(false)}>
                {language === "en" ? "Login" : "உள்நுழை"}
              </span>
            </>
          ) : (
            <>
              {language === "en" ? "Don't have an account? " : "கணக்கு இல்லையா? "}
              <span className="toggle-link register-link" onClick={() => setIsRegister(true)}>
                {language === "en" ? "Register" : "பதிவு செய்"}
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
