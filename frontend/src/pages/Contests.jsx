import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/blog.css";

export default function Contests() {
  const { language } = useContext(LanguageContext);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Translations
  const translations = {
    en: {
      heroTitle: "Writing Contests",
      heroSubtitle: "Participate in our writing competitions and showcase your talent",
      activeContests: "Active Contests",
      allContests: "All Contests",
      loading: "Loading contests...",
      noContests: "No contests available at the moment. Check back soon!",
      prizes: "Prizes",
      rules: "Rules",
      registerNow: "Register Now",
      deadline: "Deadline:",
      expired: "Expired",
      active: "Active",
      inactive: "Inactive",
      introTitle: "Showcase Your Writing Talent",
      introText: "Join our exciting writing competitions and get a chance to have your work published. Whether you're a seasoned writer or just starting, we have contests for all levels.",
      benefitsTitle: "Why Participate?",
      benefit1: "Get published by Kavithedal Publications",
      benefit2: "Win exciting cash prizes and awards",
      benefit3: "Get featured in our newsletter",
      benefit4: "Connect with other writers",
    },
    ta: {
      heroTitle: "எழுத்துப் போட்டிகள்",
      heroSubtitle: "எங்கள் எழுத்துப் போட்டிகளில் பங்கேற்று உங்கள் திறமையைக் காட்டுங்கள்",
      activeContests: "சுறுசுறுப்பான போட்டிகள்",
      allContests: "அனைத்து போட்டிகள்",
      loading: "போட்டிகள் ஏற்றுகிறது...",
      noContests: "தற்போது போட்டிகள் இல்லை. விரைவில் மீண்டும் வருக!",
      prizes: "பரிசுகள்",
      rules: "விதிகள்",
      registerNow: "இப்போது பதிவு செய்",
      deadline: "கடைசி தேதி:",
      expired: "காலாவதியான",
      active: "சுறுசுறுப்பான",
      inactive: "சுமதுர",
      introTitle: "உங்கள் எழுத்துத் திறமையைக் காட்டுங்கள்",
      introText: "எங்கள் சுவாரசியமான எழுத்துப் போட்டிகளில் பங்கேற்று உங்கள் படைப்பை வெளியிட வாய்ப்பு பெறுங்கள். நீங்கள் அனுபவமுள்ள எழுத்தாளராக இருந்தாலும் சரி, புதிதாகத் தொடங்குகிறீர்களா இருந்தாலும் சரி, எல்லா நிலைகளுக்கும் போட்டிகள் உள்ளன.",
      benefitsTitle: "ஏன் பங்கேற்க வேண்டும்?",
      benefit1: "கவித்திடல் பதிப்பகத்தால் வெளியிடப்படுங்கள்",
      benefit2: "ரொக்க பரிசுகள் மற்றும் விருதுகள் வெல்லுங்கள்",
      benefit3: "எங்கள் நியூஸ்லெட்டரில் இடம்பெறுங்கள்",
      benefit4: "மற்ற எழுத்தாளர்களுடன் இணையுங்கள்",
    },
  };

  const t = translations[language];

  useEffect(() => {
    fetchContests();
  }, [activeTab]);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "active" ? "/api/contests/active/" : "/api/contests/";
      const res = await api.get(endpoint);
      setContests(res.data.results || res.data);
    } catch (error) {
      console.error("Failed to fetch contests:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (deadline) => {
    return new Date(deadline) < new Date();
  };

  return (
    <div className="contests-page">
      
      <div className="blog-hero contests-hero">
        <h1>{t.heroTitle}</h1>
        <p>{t.heroSubtitle}</p>
      </div>

      <div className="blog-content">
        {/* Intro Section */}
        <div className="contests-intro">
          <h2>{t.introTitle}</h2>
          <p>{t.introText}</p>
          <ul className="benefits-list">
            <li>{t.benefit1}</li>
            <li>{t.benefit2}</li>
            <li>{t.benefit3}</li>
            <li>{t.benefit4}</li>
          </ul>
        </div>

        <div className="contests-tabs">
          <button 
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            {t.activeContests}
          </button>
          <button 
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            {t.allContests}
          </button>
        </div>

        {loading ? (
          <div className="loading">{t.loading}</div>
        ) : contests.length === 0 ? (
          <div className="empty-state">
            <p>{t.noContests}</p>
          </div>
        ) : (
          <div className="contests-grid">
            {contests.map((contest) => (
              <div key={contest.id} className="contest-card">
                {contest.banner_image && (
                  <div className="contest-banner">
                    <img 
                      src={contest.banner_image.startsWith('http') ? contest.banner_image : `${API_BASE}${contest.banner_image}`} 
                      alt={contest.title}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="contest-content">
                  <div className="contest-status">
                    {isExpired(contest.deadline) ? (
                      <span className="status expired">{t.expired}</span>
                    ) : contest.is_active ? (
                      <span className="status active">{t.active}</span>
                    ) : (
                      <span className="status inactive">{t.inactive}</span>
                    )}
                  </div>
                  <h3>{contest.title}</h3>
                  <p className="contest-description">{contest.description}</p>
                  
                  <div className="contest-details">
                    <div className="detail-item">
                      <span className="detail-label">📅 {t.deadline}</span>
                      <span className={`detail-value ${isExpired(contest.deadline) ? "expired" : ""}`}>
                        {formatDate(contest.deadline)}
                      </span>
                    </div>
                  </div>

                  <div className="contest-prizes">
                    <h4>{t.prizes}</h4>
                    <p>{contest.prize_details}</p>
                  </div>

                  <div className="contest-rules">
                    <h4>{t.rules}</h4>
                    <div className="rules-content">
                      {contest.rules.split('\n').map((rule, index) => (
                        <p key={index}>{rule}</p>
                      ))}
                    </div>
                  </div>

                  {!isExpired(contest.deadline) && contest.is_active && (
                    <Link to={`/contest/${contest.id}/submit`} className="participate-btn">
                      {t.registerNow}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
