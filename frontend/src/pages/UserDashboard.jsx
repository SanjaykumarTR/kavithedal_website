import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";

export default function UserDashboard() {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  useEffect(() => {
    // Get user from localStorage directly
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }
  }, []);

  // Fetch user's contest submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setSubmissionsLoading(true);
      try {
        const res = await api.get("/api/contests/submissions/my_submissions/");
        setSubmissions(res.data.results || res.data);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setSubmissionsLoading(false);
      }
    };

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  return (
    <div className="user-dashboard">
      <div className="user-dashboard-header">
        <h1>
          {language === "en" ? "My Account" : "என் கணக்கு"}
        </h1>
        <button className="logout-btn" onClick={handleLogout}>
          {language === "en" ? "Logout" : "வெளியேறு"}
        </button>
      </div>

      <div className="user-dashboard-card">
        <div className="user-avatar">
          {user?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="user-info">
          <h2>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || "User"}</h2>
          <p className="user-email">{user?.email}</p>
          <span className="user-role-badge">
            {language === "en" ? "User" : "பயனர்"}
          </span>
        </div>
      </div>

      <div className="user-dashboard-sections">
        <div className="dashboard-section" onClick={() => navigate("/books")}>
          <span className="section-icon">📚</span>
          <h3>{language === "en" ? "Browse Books" : "நூல்களை உலாவு"}</h3>
          <p>{language === "en" ? "Explore our collection" : "எங்கள் தொகுப்பை ஆராயுங்கள்"}</p>
        </div>

        <div className="dashboard-section" onClick={() => navigate("/wishlist")}>
          <span className="section-icon">🤍</span>
          <h3>{language === "en" ? "My Wishlist" : "என் விருப்பப்பட்டியல்"}</h3>
          <p>{language === "en" ? "Books you saved" : "நீங்கள் சேமித்த நூல்கள்"}</p>
        </div>

        <div className="dashboard-section" onClick={() => navigate("/cart")}>
          <span className="section-icon">🛒</span>
          <h3>{language === "en" ? "My Cart" : "என் கார்ட்"}</h3>
          <p>{language === "en" ? "Items ready to order" : "ஆர்டருக்கு தயாரான பொருட்கள்"}</p>
        </div>

        <div className="dashboard-section" onClick={() => navigate("/contests")}>
          <span className="section-icon">🏆</span>
          <h3>{language === "en" ? "Contests" : "போட்டிகள்"}</h3>
          <p>{language === "en" ? "Join writing contests" : "எழுத்துப் போட்டிகளில் சேரு"}</p>
        </div>
      </div>

      {/* My Contest Submissions */}
      <div className="user-dashboard-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 15 }}>
          {language === "en" ? "My Contest Participations" : "என் போட்டி பங்கேற்புகள்"}
        </h3>
        
        {submissionsLoading ? (
          <p>{language === "en" ? "Loading..." : "ஏற்றுகிறது..."}</p>
        ) : submissions.length === 0 ? (
          <p style={{ color: "#666" }}>
            {language === "en" 
              ? "You haven't participated in any contests yet." 
              : "நீங்கள் இன்னும் எந்த போட்டிகளிலும் பங்கேற்கவில்லை."}
          </p>
        ) : (
          <div className="contest-submissions-list">
            {submissions.map((submission) => (
              <div 
                key={submission.id} 
                className="contest-submission-item"
                style={{ 
                  padding: 15, 
                  border: "1px solid #e0e0e0", 
                  borderRadius: 8, 
                  marginBottom: 10,
                  backgroundColor: "#f9f9f9"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 5px 0" }}>{submission.contest_title}</h4>
                    <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
                      {language === "en" ? "Entry: " : "எழுத்து: "} 
                      <strong>{submission.title}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#888" }}>
                      {language === "en" ? "Type: " : "வகை: "} 
                      {submission.content_type}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span 
                      className={`status-badge ${
                        submission.status === 'approved' ? 'status-approved' : 
                        submission.status === 'rejected' ? 'status-rejected' : 
                        'status-pending'
                      }`}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: submission.status === 'approved' ? '#d4edda' : 
                                        submission.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: submission.status === 'approved' ? '#155724' : 
                              submission.status === 'rejected' ? '#721c24' : '#856404'
                      }}
                    >
                      {submission.status === 'approved' ? (language === "en" ? "Approved" : "அங்கீகரிக்கப்பட்டது") :
                       submission.status === 'rejected' ? (language === "en" ? "Rejected" : "நிராகரிக்கப்பட்டது") :
                       (language === "en" ? "Pending" : "காத்திருக்கிறது")}
                    </span>
                    <p style={{ margin: "5px 0 0 0", fontSize: 11, color: "#888" }}>
                      {new Date(submission.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button 
          className="admin-btn admin-btn-primary" 
          style={{ marginTop: 15 }}
          onClick={() => navigate("/contests")}
        >
          {language === "en" ? "Browse Contests" : "போட்டிகளை உலாவு"}
        </button>
      </div>
    </div>
  );
}
