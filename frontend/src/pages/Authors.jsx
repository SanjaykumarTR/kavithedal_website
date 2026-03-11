import { useContext, useState, useEffect } from "react";
import { LanguageContext } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/authors.css";

export default function Authors() {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const response = await api.get("/api/authors/");
        const authorsData = response.data.results || response.data;
        console.log("Authors data:", authorsData);
        setAuthors(authorsData);
      } catch (err) {
        console.error("Error fetching authors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthors();
  }, []);

  const handleAuthorClick = (authorId) => {
    navigate(`/author/${authorId}`);
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";
    if (photo.startsWith('http')) return photo;
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
    return `${API_BASE}${photo}`;
  };

  return (
    <div className="authors-page">
      <h2 className="section-title">
        {language === "en" ? "Our Authors" : "எங்கள் எழுத்தாளர்கள்"}
      </h2>

      {loading ? (
        <p>Loading authors...</p>
      ) : (
        <div className="authors-grid">
          {authors.map((author) => (
            <div 
              key={author.id} 
              className="author-card"
              onClick={() => handleAuthorClick(author.id)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={getPhotoUrl(author.photo)} 
                alt={author.name} 
              />
                <div className="author-card-info" style={{ padding: '10px' }}>
                <h3>{author.name}</h3>
                <p className="author-bio">
                  {author.biography ? (author.biography.length > 100 
                    ? author.biography.substring(0, 100) + "..." 
                    : author.biography) 
                    : "No biography available"}
                </p>
                <div style={{ backgroundColor: '#27ae60', color: 'white', padding: '10px', borderRadius: '8px', marginTop: '10px', fontWeight: 'bold', fontSize: '18px' }}>
                  📚 {author.books_count} {author.books_count === 1 ? 'Book' : 'Books'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
