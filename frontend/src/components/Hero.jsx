import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";

export default function Hero() {
  const { language } = useContext(LanguageContext);

  return (
    <section className="hero">
      <h1>
        {language === "en"
          ? "Empowering Tamil Literature"
          : "தமிழ் இலக்கியத்தை உயர்த்துவோம்"}
      </h1>
      <p>
        {language === "en"
          ? "Discover inspiring Tamil books and publications."
          : "உயர்ந்த தமிழ் நூல்கள் மற்றும் பதிப்புகளை கண்டறியுங்கள்."}
      </p>
      <button className="primary-btn">
        {language === "en" ? "Explore Books" : "நூல்கள் பார்க்க"}
      </button>
    </section>
  );
}
