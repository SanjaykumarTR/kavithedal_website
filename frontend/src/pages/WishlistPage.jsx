import { useContext } from "react";
import { Link } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/wishlist.css";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { language } = useContext(LanguageContext);

  const handleMoveToCart = (book) => {
    addToCart(book);
    toggleWishlist(book);
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-header">
        <h2 className="page-title">
          🤍 {language === "en" ? "My Wishlist" : "என் விருப்பப்பட்டியல்"}
        </h2>
        {wishlist.length > 0 && (
          <p className="wishlist-count">
            {wishlist.length} {language === "en" ? "item(s)" : "பொருட்கள்"}
          </p>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🤍</div>
          <h3>
            {language === "en"
              ? "Your wishlist is empty"
              : "உங்கள் விருப்பப்பட்டியல் காலியாக உள்ளது"}
          </h3>
          <p>
            {language === "en"
              ? "Save books you love to your wishlist and revisit them anytime."
              : "நீங்கள் விரும்பும் நூல்களை சேமித்து எப்போதும் பார்க்கலாம்."}
          </p>
          <Link to="/books" className="browse-btn">
            {language === "en" ? "Browse Books" : "நூல்களை பார்க்க"}
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((book) => (
            <div key={book.id} className="wishlist-card">
              <button
                className="wl-remove-btn"
                onClick={() => toggleWishlist(book)}
                title={language === "en" ? "Remove from wishlist" : "நீக்கவும்"}
              >
                ✕
              </button>

              <div className="wl-discount-badge">-{book.discount}%</div>

              <img src={book.image} alt={book.title} className="wl-img" />

              <div className="wl-info">
                <h4 className="wl-title">{book.title}</h4>
                <p className="wl-author">{book.author}</p>
                <span className="wl-category">{book.category}</span>

                <div className="wl-price-row">
                  <span className="wl-price">₹{book.price}</span>
                  <span className="wl-old-price">₹{book.oldPrice}</span>
                </div>

                <div className="wl-rating">
                  {"⭐".repeat(Math.floor(book.rating))}
                  <span className="wl-rating-num">({book.rating})</span>
                </div>

                <button
                  className="wl-cart-btn"
                  onClick={() => handleMoveToCart(book)}
                >
                  🛒 {language === "en" ? "Move to Cart" : "கார்டில் சேர்க்க"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
