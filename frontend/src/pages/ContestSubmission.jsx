import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";
import "../styles/blog.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ContestSubmission() {
  const { contestId } = useParams();
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    content_type: "essay",
    title: "",
    content: "",
    participant_name: "",
    participant_email: "",
    participant_contact: "",
  });

  // Translations
  const translations = {
    en: {
      title: "Submit Your Entry",
      participantDetails: "Participant Details",
      name: "Your Name:",
      email: "Email Address:",
      contact: "Contact Number:",
      selectType: "Select your writing type:",
      essay: "Essay",
      poem: "Poem",
      story: "Story",
      entryTitle: "Title of your entry:",
      entryContent: "Your content:",
      submit: "Submit Entry",
      submitting: "Submitting...",
      backToContests: "Back to Contests",
      successMessage: "Your entry has been submitted successfully!",
      loginRequired: "Please login to submit your entry.",
      login: "Login",
    },
    ta: {
      title: "உங்கள் எழுத்தை சமர்ப்பிக்கவும்",
      participantDetails: "பங்கேற்பாளர் விவரங்கள்",
      name: "உங்கள் பெயர்:",
      email: "மின்னஞ்சல் முகவரி:",
      contact: "தொடர்பு எண்:",
      selectType: "உங்கள் எழுத்து வகையைத் தேர்ந்தெடுக்கவும்:",
      essay: "கட்டுரை",
      poem: "கவிதை",
      story: "கதை",
      entryTitle: "உங்கள் எழுத்தின் தலைப்பு:",
      entryContent: "உங்கள் உள்ளடக்கம்:",
      submit: "சமர்ப்பிக்கவும்",
      submitting: "சமர்ப்பிக்கிறோம்...",
      backToContests: "போட்டிகளுக்கு திரும்பு",
      successMessage: "உங்கள் எழுத்து வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!",
      loginRequired: "உங்கள் எழுத்தை சமர்ப்பிக்க உள்நுழைக.",
      login: "உள்நுழைக",
    },
  };

  const t = translations[language];

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await api.get(`/api/contests/${contestId}/`);
        setContest(res.data);
      } catch (err) {
        console.error("Error fetching contest:", err);
      } finally {
        setLoading(false);
      }
    };

    // Check if user is logged in
    const userData = localStorage.getItem("auth_user");
    if (userData) {
      const user = JSON.parse(userData);
      setUser(user);
      // Auto-fill participant details from logged in user
      setForm((prev) => ({
        ...prev,
        participant_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.username || "",
        participant_email: user.email || "",
        participant_contact: user.phone || "",
      }));
    }

    if (contestId) {
      fetchContest();
    }
  }, [contestId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      setError(language === "en" ? "Please fill in all fields" : "தயவு செய்து அனைத்து புலங்களையும் நிரப்பவும்");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/api/contests/${contestId}/submit/`, {
        content_type: form.content_type,
        title: form.title,
        content: form.content,
        participant_name: form.participant_name,
        participant_email: form.participant_email,
        participant_contact: form.participant_contact,
      });
      setSuccess(true);
    } catch (err) {
      console.error("Error submitting entry:", err);
      if (err.response?.status === 401) {
        setError(t.loginRequired);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(language === "en" ? "Failed to submit entry" : "எழுத்தை சமர்ப்பிக்கத் தவறிவிட்டது");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contests-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="contests-page">
        <div className="empty-state">
          <p>{language === "en" ? "Contest not found" : "போட்டி கிடைக்கவில்லை"}</p>
          <Link to="/contests" className="admin-btn admin-btn-primary">
            {t.backToContests}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="contests-page">
        <div className="blog-hero contests-hero">
          <h1>{t.successMessage}</h1>
        </div>
        <div className="blog-content" style={{ textAlign: "center" }}>
          <Link to="/contests" className="admin-btn admin-btn-primary">
            {t.backToContests}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contests-page">
      <div className="blog-hero contests-hero">
        <h1>{contest.title}</h1>
        <p>{contest.description}</p>
      </div>

      <div className="blog-content">
        <div className="contest-submission-form">
          <h2>{t.title}</h2>

          {error && (
            <div className="admin-alert admin-alert-error" style={{ marginBottom: 20 }}>
              {error}
              {error === t.loginRequired && (
                <Link to="/login" className="admin-btn admin-btn-primary" style={{ marginLeft: 10 }}>
                  {t.login}
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-form-group full">
              <h3>{t.participantDetails}</h3>
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.name}</label>
              <input
                className="admin-form-input"
                type="text"
                name="participant_name"
                value={form.participant_name}
                onChange={handleChange}
                placeholder={language === "en" ? "Enter your name..." : "உங்கள் பெயரை உள்ளிடவும்..."}
                required
              />
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.email}</label>
              <input
                className="admin-form-input"
                type="email"
                name="participant_email"
                value={form.participant_email}
                onChange={handleChange}
                placeholder={language === "en" ? "Enter your email..." : "உங்கள் மின்னஞ்சலை உள்ளிடவும்..."}
                required
              />
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.contact}</label>
              <input
                className="admin-form-input"
                type="tel"
                name="participant_contact"
                value={form.participant_contact}
                onChange={handleChange}
                placeholder={language === "en" ? "Enter your contact number..." : "உங்கள் தொடர்பு எண்ணை உள்ளிடவும்..."}
                required
              />
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.selectType}</label>
              <select
                className="admin-form-input"
                name="content_type"
                value={form.content_type}
                onChange={handleChange}
              >
                <option value="essay">{t.essay}</option>
                <option value="poem">{t.poem}</option>
                <option value="story">{t.story}</option>
              </select>
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.entryTitle}</label>
              <input
                className="admin-form-input"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={language === "en" ? "Enter title..." : "தலைப்பை உள்ளிடவும்..."}
              />
            </div>

            <div className="admin-form-group full">
              <label className="admin-form-label">{t.entryContent}</label>
              <textarea
                className="admin-form-textarea"
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={15}
                placeholder={language === "en" ? "Write your essay/poem/story here..." : "உங்கள் கட்டுரை/கவிதை/கதையை இங்கே எழுதவும்..."}
              />
            </div>

            <div className="admin-form-actions" style={{ marginTop: 20 }}>
              <Link to="/contests" className="admin-btn admin-btn-secondary">
                {t.backToContests}
              </Link>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={submitting}
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
