import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { mediaUrl } from "../utils/mediaUrl";
import "../styles/wishlist.css";

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Each wishlist item: { id, book: { id, title, author_name, cover_image, price, ... }, created_at }
  const handleMoveToCart = (item) => {
    if (!user) {
      alert(language === "en" ? "Please login to add items to your cart" : "கார்ட்டில் சேர்க்க உள்நுழையவும்");
      navigate("/login");
      return;
    }
    const book = item.book;
    addToCart({
      id: book.id,
      title: book.title,
      author: book.author_name || book.author?.name || "",
      image: mediaUrl(book.cover_image),
      price: parseFloat(book.physical_final_price || book.physical_price || book.price || 0),
      oldPrice: parseFloat(book.physical_price || book.price || 0),
      discount: parseFloat(book.discount_percentage || 0),
      category: book.category_name || "",
      book_type: book.book_type || "physical",
    });
    toggleWishlist(book);
  };

  const handleRemove = (item) => {
    toggleWishlist(item.book);
  };

  const getBookPrice = (book) => {
    return parseFloat(
      book.physical_final_price || book.physical_price || book.price || 0
    );
  };

  const getOldPrice = (book) => {
    return parseFloat(book.physical_price || book.price || 0);
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
          {wishlist.map((item) => {
            const book = item.book;
            const price = getBookPrice(book);
            const oldPrice = getOldPrice(book);
            const hasDiscount = parseFloat(book.discount_percentage || 0) > 0;

            return (
              <div key={item.id} className="wishlist-card">
                {/* Remove button */}
                <button
                  className="wl-remove-btn"
                  onClick={() => handleRemove(item)}
                  title={language === "en" ? "Remove from wishlist" : "நீக்கவும்"}
                >
                  ✕
                </button>

                {hasDiscount && (
                  <div className="wl-discount-badge">
                    -{book.discount_percentage}%
                  </div>
                )}

                <Link to={`/book/${book.id}`}>
                  <img
                    src={mediaUrl(book.cover_image)}
                    alt={book.title}
                    className="wl-img"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop";
                    }}
                  />
                </Link>

                <div className="wl-info">
                  <h4 className="wl-title">
                    <Link to={`/book/${book.id}`}>{book.title}</Link>
                  </h4>
                  <p className="wl-author">
                    {book.author_name || book.author?.name}
                  </p>
                  {book.category_name && (
                    <span className="wl-category">{book.category_name}</span>
                  )}

                  <div className="wl-price-row">
                    <span className="wl-price">₹{price}</span>
                    {hasDiscount && (
                      <span className="wl-old-price">₹{oldPrice}</span>
                    )}
                  </div>

                  <div className="wl-actions">
                    <button
                      className="wl-cart-btn"
                      onClick={() => handleMoveToCart(item)}
                    >
                      🛒{" "}
                      {language === "en" ? "Move to Cart" : "கார்டில் சேர்க்க"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
