import { useState, useEffect, useContext } from "react";
import api from "../api/axios";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/blog.css";

export default function Testimonials() {
  const { language } = useContext(LanguageContext);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "reader",
    message: "",
    rating: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Translations
  const translations = {
    en: {
      heroTitle: "What Our Readers Say",
      heroSubtitle: "Discover what book lovers and authors say about Kavithedal Publications",
      shareExperience: "Share Your Experience",
      cancel: "✕ Cancel",
      yourName: "Your Name",
      enterName: "Enter your name",
      iAmA: "I am a",
      reader: "Reader",
      author: "Author",
      yourMessage: "Your Message",
      shareExperiencePlaceholder: "Share your experience with us...",
      rating: "Rating",
      submit: "Submit Testimonial",
      submitting: "Submitting...",
      thankYou: "Thank you! Your testimonial has been submitted for review.",
      loading: "Loading testimonials...",
      noTestimonials: "No testimonials yet. Be the first to share your experience!",
      registerNow: "Register Now",
      introTitle: "Why Share Your Experience?",
      introText: "Your feedback helps us improve and helps other readers discover great books. Share your thoughts about our publications, authors, or any book that touched your heart.",
      benefitsTitle: "What Readers Say",
      benefit1: "Connect with a community of book lovers",
      benefit2: "Help others discover great reads",
      benefit3: "Support Tamil literature and authors",
    },
    ta: {
      heroTitle: "எங்கள் வாசகர்கள் என்ன சொல்கிறார்கள்",
      heroSubtitle: "கவித்திடல் பதிப்பகத்தைப் பற்றி புத்தகக் காதலர்கள் மற்றும் எழுத்தாளர்கள் என்ன சொல்கிறார்கள் கண்டுபிடித்துக் கொள்ளுங்கள்",
      shareExperience: "உங்கள் அனுபவத்தைப் பகிருங்கள்",
      cancel: "✕ ரத்து",
      yourName: "உங்கள் பெயர்",
      enterName: "உங்கள் பெயரை உள்ளிடுக",
      iAmA: "நான் ஒரு",
      reader: "வாசகர்",
      author: "எழுத்தாளர்",
      yourMessage: "உங்கள் செய்தி",
      shareExperiencePlaceholder: "உங்கள் அனுபவத்தை எங்களுடன் பகிருங்கள்...",
      rating: "மதிப்பீடு",
      submit: "சான்றைச் சமர்ப்பிக்க",
      submitting: "சமர்ப்பித்து...",
      thankYou: "நன்றி! உங்கள் சான்று மதிப்பாய்வுக்காகச் சமர்ப்பிக்கப்பட்டது.",
      loading: "சான்றுகள் ஏற்றுகிறது...",
      noTestimonials: "இன்னும் சான்றுகள் இல்லை. உங்கள் அனுபவத்தை முதலில் பகிருங்கள்!",
      registerNow: "இப்போது பதிவு செய்",
      introTitle: "உங்கள் அனுபவத்தை ஏன் பகிர வேண்டும்?",
      introText: "உங்கள் கருத்து எங்கள் மேம்பாட்டிற்கு உதவுகிறது மற்றும் மற்ற வாசகர்கள் சிறந்த புத்தகங்களைக் கண்டுபிடிப்பதற்கு உதவுகிறது. எங்கள் பதிப்பகம், எழுத்தாளர்கள் அல்லது உங்கள் மனதைத் தொடும் எந்தப் புத்தகத்தைப் பற்றியும் உங்கள் கருத்துகளைப் பகிருங்கள்.",
      benefitsTitle: "வாசகர்கள் என்ன சொல்கிறார்கள்",
      benefit1: "புத்தகக் காதலர்கள் சமூகத்துடன் இணையுங்கள்",
      benefit2: "மற்றவர்கள் சிறந்த புத்தகங்களைக் கண்டுபிடிப்பதற்கு உதவுங்கள்",
      benefit3: "தமிழ் இலக்கியத்தையும் எழுத்தாளர்களையும் ஆதரியுங்கள்",
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await api.get("/api/testimonials/");
      setTestimonials(res.data.results || res.data);
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/api/testimonials/", formData);
      setSuccess(true);
      setFormData({ name: "", email: "", role: "reader", message: "", rating: 5 });
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit testimonial:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingStars = (rating) => {
    return "⭐".repeat(rating);
  };

  // Helper function to convert video URL to embed URL
  const getVideoEmbedUrl = (url, videoType) => {
    if (!url) return null;
    
    if (videoType === "youtube") {
      // Handle various YouTube URL formats
      const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    } else if (videoType === "vimeo") {
      // Handle Vimeo URL format
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    
    // For uploaded videos, return as-is
    return url;
  };

  return (
    <div className="testimonials-page">
      
      <div className="blog-hero" style={{ background: '#B71C1C', padding: '60px 20px' }}>
        <h1 className="section-title" style={{ color: '#fff', fontSize: '2.5rem' }}>{t.heroTitle}</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', textAlign: 'center', maxWidth: '700px', margin: '20px auto 0' }}>{t.heroSubtitle}</p>
      </div>

      <div className="blog-content">
        {/* Intro Section */}
        <div className="testimonials-intro">
          <h2>{t.introTitle}</h2>
          <p>{t.introText}</p>
          <ul className="benefits-list">
            <li>{t.benefit1}</li>
            <li>{t.benefit2}</li>
            <li>{t.benefit3}</li>
          </ul>
        </div>

        <div className="testimonials-header">
          <button 
            className="submit-testimonial-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? t.cancel : "📝 " + t.shareExperience}
          </button>
        </div>

        {showForm && (
          <div className="testimonial-form-container">
            <form onSubmit={handleSubmit} className="testimonial-form">
              <h3>{t.shareExperience}</h3>
              {success && (
                <div className="success-message">
                  {t.thankYou}
                </div>
              )}
              <div className="form-group">
                <label>{t.yourName}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder={t.enterName}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label>{t.iAmA}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="reader">{t.reader}</option>
                  <option value="author">{t.author}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t.yourMessage}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  placeholder={t.shareExperiencePlaceholder}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>{t.rating}</label>
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${formData.rating >= star ? "active" : ""}`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">{t.loading}</div>
        ) : testimonials.length === 0 ? (
          <div className="empty-state">
            <p>{t.noTestimonials}</p>
          </div>
        ) : (
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    {testimonial.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <span className="testimonial-role">
                      {language === "en" 
                        ? (testimonial.role === "reader" ? "Reader" : "Author")
                        : (testimonial.role === "reader" ? "வாசகர்" : "எழுத்தாளர்")
                      }
                    </span>
                  </div>
                  <div className="testimonial-rating">
                    {getRatingStars(testimonial.rating)}
                  </div>
                </div>
                <p className="testimonial-message">"{testimonial.message}"</p>
                {testimonial.has_video && (testimonial.video_url || testimonial.video_file) && (
                  <div className="testimonial-video">
                    {testimonial.video_type === "youtube" || testimonial.video_type === "vimeo" ? (
                      <iframe
                        src={getVideoEmbedUrl(testimonial.video_url, testimonial.video_type)}
                        title="Testimonial Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : testimonial.video_file ? (
                      <video controls src={testimonial.video_file} style={{ width: '100%', borderRadius: '8px' }}>
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <video controls src={testimonial.video_url} style={{ width: '100%', borderRadius: '8px' }}>
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
