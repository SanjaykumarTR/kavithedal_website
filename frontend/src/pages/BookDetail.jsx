import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import api from "../api/axios";
import { createOrder, checkBookAccess } from "../api/orders";
import "../styles/bookDetail.css";

export default function BookDetail() {
  const { id } = useParams();
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("physical");
  const [hasAccess, setHasAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingData, setShippingData] = useState({
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_pincode: "",
    shipping_phone: ""
  });
  
  const translations = {
    en: {
      by: "by",
      pages: "pages",
      language: "Language",
      description: "Description",
      selectFormat: "Select Format",
      ebook: "eBook",
      physical: "Physical Book",
      buyNow: "Buy Now",
      readNow: "Read Now",
      addToCart: "Add to Cart",
      alreadyOwned: "You already own this book",
      purchase: "Purchase",
      shippingDetails: "Shipping Details",
      address: "Address",
      city: "City",
      state: "State",
      pincode: "Pincode",
      phone: "Phone Number",
      proceedToPayment: "Complete Purchase",
      processing: "Processing...",
      error: "Error",
      bookNotFound: "Book not found",
      loginToPurchase: "Please login to purchase books",
      purchaseSuccess: "Purchase successful!",
      orderPlaced: "Your order has been placed."
    },
    ta: {
      by: "வழங்கிய",
      pages: "பக்கங்கள்",
      language: "மொழி",
      description: "விளக்கம்",
      selectFormat: "வடிவத்தைத் தேர்ந்தெடுக்கவும்",
      ebook: "இ-புத்தகம்",
      physical: "இயல்பான புத்தகம்",
      buyNow: "இப்போது வாங்கு",
      readNow: "இப்போது படி",
      addToCart: "கார்ட்டில் சேர்",
      alreadyOwned: "இந்த புத்தகத்தை ஏற்கனவு வாங்கி விட்டீர்கள்",
      purchase: "வாங்க",
      shippingDetails: "shipping விவரங்கள்",
      address: "முகவரி",
      city: "நகரம்",
      state: "மாநிலம்",
      pincode: "பின்கோடு",
      phone: "தொலைபேசி எண்",
      proceedToPayment: "வாங்க முடி",
      processing: "செயலாக்குகிறது...",
      error: "பிழை",
      bookNotFound: "புத்தகம் கிடைக்கவில்லை",
      loginToPurchase: "புத்தகங்களை வாங்க உள்நுழையவும்",
      purchaseSuccess: "வாங்கியது வெற்றியாக உள்ளது!",
      orderPlaced: "உங்கள் ஆணை வழங்கப்பட்டது."
    }
  };
  
  const t = translations[language];
  
  useEffect(() => {
    fetchBook();
  }, [id]);
  
  useEffect(() => {
    if (user && book) {
      checkAccess();
    }
  }, [user, book]);
  
  const fetchBook = async () => {
    try {
      const response = await api.get(`/api/books/${id}/`);
      setBook(response.data);
      
      // Set default type based on book availability
      if (response.data.ebook_price && response.data.physical_price) {
        setSelectedType("physical");
      } else if (response.data.ebook_price) {
        setSelectedType("ebook");
      } else if (response.data.physical_price) {
        setSelectedType("physical");
      }
    } catch (error) {
      console.error("Failed to fetch book:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkAccess = async () => {
    try {
      const response = await checkBookAccess(id);
      setHasAccess(response.has_access);
    } catch (error) {
      console.error("Failed to check access:", error);
    }
  };
  
  const handlePurchase = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (selectedType === "physical") {
      setShowShippingForm(true);
      return;
    }
    
    await initiatePurchase({});
  };
  
  const initiatePurchase = async (shipping) => {
    setPurchasing(true);
    setError("");
    
    try {
      // Create order with simulated purchase - no payment required
      const orderData = await createOrder(id, selectedType, shipping);
      
      // Simulated purchase - order is completed directly
      if (orderData.purchased || orderData.status === 'completed') {
        alert(language === "en" ? 
          `Purchase successful! Your ${selectedType === 'ebook' ? 'eBook' : 'book'} has been ${selectedType === 'ebook' ? 'added to your library' : 'ordered'}.` : 
          `வாங்கியது வெற்றியாக உள்ளது! உங்கள் ${selectedType === 'ebook' ? 'இ-புத்தகம்' : 'புத்தகம்'} ${selectedType === 'ebook' ? 'உங்கள் நூலகத்தில் சேர்க்கப்பட்டது' : 'ஆணை வழங்கப்பட்டது'}.`
        );
        
        if (selectedType === "ebook") {
          navigate("/library");
        } else {
          navigate("/library?tab=orders");  // Show orders tab in library for physical books
        }
      }
      
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create order");
    } finally {
      setPurchasing(false);
    }
  };
  
  const handleShippingSubmit = (e) => {
    e.preventDefault();
    initiatePurchase(shippingData);
    setShowShippingForm(false);
  };
  
  const handleAddToCart = () => {
    addToCart(book);
    alert(language === "en" ? "Added to cart!" : "கார்ட்டில் சேர்க்கப்பட்டது!");
  };
  
  if (loading) {
    return (
      <div className="book-detail-loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!book) {
    return (
      <div className="book-detail-error">
        <h2>{t.bookNotFound}</h2>
        <Link to="/books">{language === "en" ? "Back to Books" : "புத்தகங்களுக்கு திரும்பு"}</Link>
      </div>
    );
  }
  
  const price = book.physical_price || book.price;
  const isAvailable = book.physical_price || book.price;
  
  // Get discounted prices from API
  const originalPhysicalPrice = book.physical_price || book.price;
  const discountedPhysicalPrice = book.physical_final_price || originalPhysicalPrice;
  const hasDiscount = book.discount_percentage > 0;
  
  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        <div className="book-detail-left">
          {hasDiscount && (
            <span className="book-discount-badge">-{book.discount_percentage}% OFF</span>
          )}
          <img 
            src={book.cover_image} 
            alt={book.title} 
            className="book-detail-cover"
          />
        </div>
        
        <div className="book-detail-right">
          <h1 className="book-detail-title">{book.title}</h1>
          <p className="book-detail-author">
            {t.by} {book.author_name || book.author?.name}
          </p>
          
          <div className="book-detail-meta">
            {book.pages > 0 && <span>{book.pages} {t.pages}</span>}
            <span>{book.language}</span>
          </div>
          
          {hasAccess ? (
            <div className="book-owned-section">
              <p className="owned-message">{t.alreadyOwned}</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link to={`/reader/${book.id}`} className="btn-read-now">
                  {t.readNow}
                </Link>
              </div>
            </div>
          ) : (
            <div className="book-price-section">
              <button 
                className="btn-buy-now"
                onClick={handleAddToCart}
              >
                {t.addToCart}
              </button>
              {error && <p className="error-message">{error}</p>}
            </div>
          )}
          
          <div className="book-description">
            <h3>{t.description}</h3>
            <p>{book.description}</p>
          </div>
        </div>
      </div>
      
      {showShippingForm && (
        <div className="shipping-modal">
          <div className="shipping-modal-content">
            <h3>{t.shippingDetails}</h3>
            <form onSubmit={handleShippingSubmit}>
              <div className="form-group">
                <label>{t.address}</label>
                <textarea
                  value={shippingData.shipping_address}
                  onChange={(e) => setShippingData({...shippingData, shipping_address: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.city}</label>
                <input
                  type="text"
                  value={shippingData.shipping_city}
                  onChange={(e) => setShippingData({...shippingData, shipping_city: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.state}</label>
                <input
                  type="text"
                  value={shippingData.shipping_state}
                  onChange={(e) => setShippingData({...shippingData, shipping_state: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.pincode}</label>
                <input
                  type="text"
                  value={shippingData.shipping_pincode}
                  onChange={(e) => setShippingData({...shippingData, shipping_pincode: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.phone}</label>
                <input
                  type="tel"
                  value={shippingData.shipping_phone}
                  onChange={(e) => setShippingData({...shippingData, shipping_phone: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowShippingForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {t.proceedToPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
