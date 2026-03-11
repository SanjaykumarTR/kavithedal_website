import { useContext, useState } from "react";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";
import "../styles/blog.css";

export default function Blog() {
  const { language } = useContext(LanguageContext);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    bookTitle: "",
    description: "",
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setFormData({ ...formData, file: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('contact', formData.contact);
    formDataToSend.append('book_title', formData.bookTitle);
    formDataToSend.append('description', formData.description);
    if (formData.file) {
      formDataToSend.append('file', formData.file);
    }

    try {
      await api.post('/api/books/submissions/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(language === "en" ? "Book submitted successfully! We will contact you soon." : "புத்தகம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது! விரைவில் உங்களைத் தொடர்புக்கொள்ளும்ம.");
      setFormData({
        name: "",
        email: "",
        contact: "",
        bookTitle: "",
        description: "",
        file: null,
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting book:", error);
      alert(language === "en" ? "Failed to submit book. Please try again." : "புத்தகத்தைச் சமர்ப்பிப்பதில் தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.");
    }
  };

  return (
    <div className="books-layout">
      <div className="products-section">

        {!showForm && (
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

            <button
              className="submit-btn"
              onClick={() => setShowForm(true)}
            >
              {language === "en"
                ? "I Want to Be a Writer"
                : "நான் எழுத்தாளராக விரும்புகிறேன்"}
            </button>
          </div>
        )}

        {showForm && (
          <div className="submission-layout">

            {/* LEFT SIDE FORM */}
            <div className="form-container">
              <div className="products-header">
                <h2 className="section-title">
                  {language === "en"
                    ? "Submit Your Book"
                    : "உங்கள் புத்தகத்தை சமர்ப்பிக்கவும்"}
                </h2>
              </div>

              <form className="submission-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{language === "en" ? "Full Name" : "முழு பெயர்"}</label>
                  <input type="text" name="name" required onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Email Address" : "மின்னஞ்சல்"}</label>
                  <input type="email" name="email" required onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Contact Number" : "தொடர்பு எண்"}</label>
                  <input type="tel" name="contact" required onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Book Title" : "புத்தகத்தின் தலைப்பு"}</label>
                  <input type="text" name="bookTitle" required onChange={handleChange} />
                </div>

                <div className="form-group">
                  <label>{language === "en" ? "Book Description" : "புத்தக விளக்கம்"}</label>
                  <textarea name="description" rows="5" required onChange={handleChange}></textarea>
                </div>

                <div className="form-group">
                  <label>
                    {language === "en"
                      ? "Upload Book File (PDF)"
                      : "புத்தக கோப்பு பதிவேற்றம்"}
                  </label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf"
                    required
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="submit-btn">
                  {language === "en" ? "Submit Book" : "சமர்ப்பிக்கவும்"}
                </button>
              </form>
            </div>

            {/* RIGHT SIDE LITERATURE PANEL */}
            <div className="literature-panel">
              <h3>📜 தமிழ் இலக்கியம்</h3>

              <div className="poem-box">
                <p>
                  “யாதும் ஊரே யாவரும் கேளிர்”  
                  <br />
                  – கணியன் பூங்குன்றனார்
                </p>
              </div>

              <div className="poem-box">
                <p>
                  “அறத்துப்பால் கூறும் திருக்குறள்  
                  வாழ்வின் வழிகாட்டி.”
                </p>
              </div>

              <div className="poem-box">
                <p>
                  “தமிழ் என்பது மொழி மட்டும் அல்ல,  
                  அது ஒரு உணர்வு.”
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
