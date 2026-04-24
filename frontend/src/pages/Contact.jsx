import { useState, useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";

export default function Contact() {
  const { language } = useContext(LanguageContext);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/books/contact-messages/", form);
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error sending message:", error);
      alert(language === "en" ? "Failed to send message. Please try again." : "செய்தியை அனுப்புவதில் தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <h2 className="section-title">
        {language === "en" ? "Contact Us" : "எங்களை தொடர்பு கொள்ளுங்கள்"}
      </h2>

      <div className="contact-wrapper">
        {/* Contact Info */}
        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-icon">📍</span>
            <div>
              <h4>{language === "en" ? "Address" : "முகவரி"}</h4>
              <p>Odasalpatti X Road
Harur - Dharmapuri Highway
Dharmapuri, Tamil Nadu, India</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <div>
              <h4>{language === "en" ? "Phone" : "தொலைபேசி"}</h4>
              <p>+917904730223 </p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">✉️</span>
            <div>
              <h4>{language === "en" ? "Email" : "மின்னஞ்சல்"}</h4>
              <p>kavithedaldpi@gmail.com</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-icon">🕐</span>
            <div>
              <h4>{language === "en" ? "Hours" : "நேரம்"}</h4>
              <p>{language === "en" ? "Mon - Sat: 9AM - 7PM" : "திங்கள் - சனி: காலை 9 - மாலை 7"}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form className="contact-form" onSubmit={handleSubmit}>
          {submitted && (
            <div className="success-msg">
              {language === "en"
                ? "Message sent successfully!"
                : "செய்தி வெற்றிகரமாக அனுப்பப்பட்டது!"}
            </div>
          )}
          <input
            type="text"
            name="name"
            placeholder={language === "en" ? "Your Name" : "உங்கள் பெயர்"}
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder={language === "en" ? "Your Email" : "உங்கள் மின்னஞ்சல்"}
            value={form.email}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            placeholder={language === "en" ? "Your Message" : "உங்கள் செய்தி"}
            value={form.message}
            onChange={handleChange}
            required
          ></textarea>
          <button type="submit">
            {language === "en" ? "Send Message" : "செய்தி அனுப்பு"}
          </button>
        </form>
      </div>
    </div>
  );
}
