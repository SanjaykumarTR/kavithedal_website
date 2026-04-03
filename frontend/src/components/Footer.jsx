import { Link } from "react-router-dom";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export default function Footer() {
  const { language } = useContext(LanguageContext);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Kavithedal</h3>
          <p>
            {language === "en"
              ? "we own your trust "
              : " நாங்கள் உங்கள் நம்பிக்கையை சார்ந்து இருக்கிறோம்"}
          </p>
        </div>

        <div className="footer-section">
          <h4>{language === "en" ? "Quick Links" : "விரைவு இணைப்புகள்"}</h4>
          <Link to="/books">{language === "en" ? "Books" : "நூல்கள்"}</Link>
          <Link to="/authors">{language === "en" ? "Authors" : "எழுத்தாளர்கள்"}</Link>
          <Link to="/blog">{language === "en" ? "Blog" : "வலைப்பதிவு"}</Link>
        </div>

        <div className="footer-section">
          <h4>{language === "en" ? "Company" : "நிறுவனம்"}</h4>
          <Link to="/about">{language === "en" ? "About Us" : "எங்களை பற்றி"}</Link>
          <Link to="/contact">{language === "en" ? "Contact" : "தொடர்பு"}</Link>
        </div>

        <div className="footer-section">
          <h4>{language === "en" ? "Contact" : "தொடர்பு"}</h4>
          <p>kavithedaldpi@gmail.com</p>
          <p>+91 7904730223</p>
          <p>Odasalpatti X Road Harur - Dharmapuri Highway, Dharmapuri-635 303, Tamil Nadu, India</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Kavithedal Publications. {language === "en" ? "All rights reserved." : "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."}</p>
      </div>
    </footer>
  );
}
