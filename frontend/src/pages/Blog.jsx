import { useContext, useState } from "react";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";
import "../styles/blog.css";

export default function Blog() {
  const { language } = useContext(LanguageContext);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = {
    name: "",
    email: "",
    contact: "",
    bookTitle: "",
    description: "",
    file: null,
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData((prev) => ({ ...prev, file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("contact", formData.contact);
    formDataToSend.append("book_title", formData.bookTitle);
    formDataToSend.append("description", formData.description);
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }

    try {
      await api.post("/api/books/submissions/", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData(emptyForm);
      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting book:", err);
      setError(
        language === "en"
          ? "Failed to submit. Please try again."
          : "சமர்ப்பிப்பதில் தவறு. மீண்டும் முயற்சிக்கவும்."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setShowForm(false);
    setFormData(emptyForm);
    setError("");
  };

  return (
    <div className="books-layout">
      <div className="products-section">

        {/* ── Intro screen ── */}
        {!showForm && !submitted && (
          <div className="writer-intro">
            <h2>
              {language === "en"
                ? "Do You Dream of Becoming a Writer?"
                : "நீங்கள் ஒரு எழுத்தாளராக ஆக விரும்புகிறீர்களா?"}
            </h2>
            <p>
              {language === "en"
                ? "If you want to publish your book with us and start your writing journey, click the button below."
                : "உங்கள் புத்தகத்தை வெளியிட்டு உங்கள் எழுத்து பயணத்தை தொடங்க விரும்பினால், கீழே உள்ள பொத்தானை அழுத்தவும்."}
            </p>
            <button className="submit-btn" onClick={() => setShowForm(true)}>
              {language === "en"
                ? "I Want to Be a Writer"
                : "நான் எழுத்தாளராக விரும்புகிறேன்"}
            </button>
          </div>
        )}

        {/* ── Success screen ── */}
        {submitted && (
          <div className="submission-success">
            <div className="success-icon">✅</div>
            <h2>
              {language === "en"
                ? "Book Submitted Successfully!"
                : "புத்தகம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!"}
            </h2>
            <p>
              {language === "en"
                ? "Thank you! Our team will review your submission and contact you soon."
                : "நன்றி! எங்கள் குழு உங்கள் சமர்ப்பிப்பை மதிப்பாய்வு செய்து விரைவில் தொடர்புகொள்ளும்."}
            </p>
            <div className="success-details">
              <span>📧</span>
              {language === "en"
                ? "A notification has been sent to our editorial team."
                : "எங்கள் ஆசிரியர் குழுவிற்கு அறிவிப்பு அனுப்பப்பட்டது."}
            </div>
            <button className="submit-btn" onClick={handleReset}>
              {language === "en" ? "Submit Another Book" : "மேலும் ஒரு புத்தகம் சமர்ப்பிக்கவும்"}
            </button>
          </div>
        )}

        {/* ── Submission form ── */}
        {showForm && !submitted && (
          <div className="submission-layout">

            {/* LEFT: Form */}
            <div className="form-container">
              <div className="products-header">
                <h2 className="section-title">
                  {language === "en"
                    ? "Submit Your Book"
                    : "உங்கள் புத்தகத்தை சமர்ப்பிக்கவும்"}
                </h2>
              </div>

              {error && (
                <div className="submission-error">
                  ⚠️ {error}
                </div>
              )}

              <form className="submission-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{language === "en" ? "Full Name" : "முழு பெயர்"} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    required
                    onChange={handleChange}
                    placeholder={language === "en" ? "Enter your full name" : "உங்கள் முழு பெயரை உள்ளிடுக"}
                  />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Email Address" : "மின்னஞ்சல்"} *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    required
                    onChange={handleChange}
                    placeholder={language === "en" ? "Enter your email" : "மின்னஞ்சல் உள்ளிடுக"}
                  />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Contact Number" : "தொடர்பு எண்"} *</label>
                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    required
                    onChange={handleChange}
                    placeholder={language === "en" ? "Enter your phone number" : "தொலைபேசி எண் உள்ளிடுக"}
                  />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Book Title" : "புத்தகத்தின் தலைப்பு"} *</label>
                  <input
                    type="text"
                    name="bookTitle"
                    value={formData.bookTitle}
                    required
                    onChange={handleChange}
                    placeholder={language === "en" ? "Enter book title" : "புத்தக தலைப்பை உள்ளிடுக"}
                  />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Book Description" : "புத்தக விளக்கம்"} *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    rows="5"
                    required
                    onChange={handleChange}
                    placeholder={
                      language === "en"
                        ? "Briefly describe your book (genre, theme, summary...)"
                        : "உங்கள் புத்தகத்தை சுருக்கமாக விளக்குக..."
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    {language === "en"
                      ? "Upload Book File (PDF)"
                      : "புத்தக கோப்பு பதிவேற்றம் (PDF)"}
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf"
                    onChange={handleChange}
                  />
                  <small style={{ color: "#888", fontSize: "12px" }}>
                    {language === "en" ? "Optional — PDF format only" : "விரும்பினால் — PDF மட்டும்"}
                  </small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {language === "en" ? "Cancel" : "ரத்துசெய்"}
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading
                      ? (language === "en" ? "Submitting..." : "சமர்ப்பிக்கிறது...")
                      : (language === "en" ? "Submit Book" : "சமர்ப்பிக்கவும்")}
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT: Literature panel */}
            <div className="literature-panel">
              <h3>📜 தமிழ் இலக்கியம்</h3>
              <div className="poem-box">
                <p>
                  "யாதும் ஊரே யாவரும் கேளிர்"
                  <br />– கணியன் பூங்குன்றனார்
                </p>
              </div>
              <div className="poem-box">
                <p>
                  "அறத்துப்பால் கூறும் திருக்குறள்
                  வாழ்வின் வழிகாட்டி."
                </p>
              </div>
              <div className="poem-box">
                <p>
                  "தமிழ் என்பது மொழி மட்டும் அல்ல,
                  அது ஒரு உணர்வு."
                </p>
              </div>
              <div className="quote-footer">
                ✨ எழுதுங்கள். உலகம் படிக்கும்.
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
