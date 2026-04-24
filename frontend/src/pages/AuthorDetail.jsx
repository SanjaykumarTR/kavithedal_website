import { useContext, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import api from "../api/axios";
import "../styles/authors.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AuthorDetail() {
  const { id } = useParams();
  const { language } = useContext(LanguageContext);
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      try {
        // Fetch author details
        const authorRes = await api.get(`/api/authors/${id}/`);
        setAuthor(authorRes.data);
        
        // Fetch books by this author
        const booksRes = await api.get(`/api/authors/${id}/books/`);
        setBooks(booksRes.data.results || booksRes.data);
      } catch (err) {
        console.error("Error fetching author:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchAuthorDetails();
    }
  }, [id]);

  const getPhotoUrl = (photo) => {
    if (!photo) return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop";
    if (photo.startsWith('http')) return photo;
    return `${API_BASE}${photo}`;
  };

  if (loading) {
    return <div className="author-detail-loading">Loading...</div>;
  }

  if (!author) {
    return <div className="author-detail-error">Author not found</div>;
  }

  return (
    <div className="author-detail-page">
      <div className="author-detail-container">
        {/* Author Header */}
        <div className="author-detail-header">
          <div className="author-detail-photo">
            <img 
              src={getPhotoUrl(author.photo)} 
              alt={author.name} 
            />
          </div>
          <div className="author-detail-info">
            <h1>{author.name}</h1>
            <div className="author-detail-stats">
              <span className="author-books-count" style={{ background: '#27ae60', color: 'white', padding: '8px 20px', fontSize: '1rem', fontWeight: 'bold' }}>
                {Number(books.length)} {Number(books.length) === 1 ? 'Book' : 'Books'}
              </span>
            </div>
          </div>
        </div>

        {/* Author Biography */}
        {author.biography && (
          <div className="author-detail-bio">
            <h2>{language === "en" ? "Biography" : "வாழ்க்கை வரலாறு"}</h2>
            <p>{author.biography}</p>
          </div>
        )}

        {/* Author's Books */}
        <div className="author-detail-books">
          <h2>{language === "en" ? "Books by " + author.name : author.name + "இன் நூல்கள்"}</h2>
          {books.length > 0 ? (
            <div className="author-books-grid">
              {books.map((book) => (
                <Link to={`/book/${book.id}`} key={book.id} className="author-book-card">
                  {book.cover_image && (
                    <img 
                      src={book.cover_image.startsWith('http') ? book.cover_image : `${API_BASE}${book.cover_image}`} 
                      alt={book.title} 
                    />
                  )}
                  <div className="author-book-info">
                    <h3>{book.title}</h3>
                    <p className="book-price">
                      {book.discount_percentage > 0 ? (
                        <>
                          <span className="original-price">₹{parseFloat(book.price).toFixed(2)}</span>
                          <span className="discounted-price">
                            ₹{(parseFloat(book.price) - (parseFloat(book.price) * book.discount_percentage / 100)).toFixed(2)}
                          </span>
                          <span className="discount-badge">-{book.discount_percentage}%</span>
                        </>
                      ) : (
                        <span>₹{parseFloat(book.price).toFixed(2)}</span>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="no-books">
              {language === "en" ? "No books available yet." : "இன்னும் புத்தகங்கள் இல்லை."}
            </p>
          )}
        </div>

        {/* Back Button */}
        <div className="author-detail-back">
          <Link to="/authors" className="back-link">
            ← {language === "en" ? "Back to Authors" : "எழுத்தாளர்கள் பக்கத்திற்கு திரும்பு"}
          </Link>
        </div>
      </div>
    </div>
  );
}
