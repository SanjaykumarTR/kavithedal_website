import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { mediaUrl } from "../utils/mediaUrl";
import "../styles/bookDetail.css";

export default function PhysicalPurchase() {
  const { id } = useParams();
  const { language } = useContext(LanguageContext);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    phone: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: "",
    shipping_pincode: ""
  });
  
  const translations = {
    en: {
      title: "Physical Book Purchase",
      bookDetails: "Book Details",
      customerDetails: "Customer Details",
      fullName: "Full Name",
      email: "Email Address",
      phone: "Phone Number",
      address: "Shipping Address",
      city: "City",
      state: "State",
      pincode: "Pincode",
      checkDelivery: "Check Delivery",
      proceedToPay: "Proceed to Pay",
      price: "Price",
      deliveryCharge: "Delivery Charge",
      totalPrice: "Total Price",
      estimatedDelivery: "Estimated Delivery",
      processing: "Processing...",
      bookNotFound: "Book not found",
      loginRequired: "Please login to purchase books",
      purchaseSuccess: "Purchase Successful!",
      backToHome: "Back to Home",
      goToOrders: "Go to Orders",
      deliveryAvailable: "Delivery Available",
      checkingDeliveryInfo: "Checking delivery..."
    },
    ta: {
      title: "இயல்பான புத்தகம் வாங்குதல்",
      bookDetails: "புத்தக விவரங்கள்",
      customerDetails: "வாடகை விவரங்கள்",
      fullName: "முழு பெயர்",
      email: "மின்னஞ்சல் முகவரி",
      phone: "தொலைபேசி எண்",
      address: "Shipping முகவரி",
      city: "நகரம்",
      state: "மாநிலம்",
      pincode: "பின்கோடு",
      checkDelivery: "டெலிவரி சரிபார்",
      proceedToPay: "பணம் செலுத்து",
      price: "விலை",
      deliveryCharge: "டெலிவரி கட்டணம்",
      totalPrice: "மொத்த விலை",
      estimatedDelivery: "மதிப்பிட்ட டெலிவரி",
      processing: "செயலாக்குகிறது...",
      bookNotFound: "புத்தகம் கிடைக்கவில்லை",
      loginRequired: "புத்தகங்களை வாங்க உள்நுழையவும்",
      purchaseSuccess: "வாங்கியது வெற்றியாக உள்ளது!",
      backToHome: "முகப்பு பக்கம்",
      goToOrders: "ஆணைகளுக்கு செல்",
      deliveryAvailable: "டெலிவரி கிடைக்கிறது",
      checkingDeliveryInfo: "டெலிவரி சரிபார்க்கிறது..."
    }
  };
  
  const t = translations[language];
  
  useEffect(() => {
    fetchBook();
  }, [id]);
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        user_name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);
  
  const fetchBook = async () => {
    try {
      const response = await api.get(`/api/books/${id}/`);
      setBook(response.data);
    } catch (error) {
      console.error("Failed to fetch book:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const checkDelivery = async () => {
    if (!formData.shipping_pincode || formData.shipping_pincode.length < 6) {
      setError("Please enter a valid PIN code");
      return;
    }
    
    setCheckingDelivery(true);
    setError("");
    
    try {
      const bookPrice = book.physical_price || book.price;
      const response = await api.post("/api/orders/delivery-zones/calculate/", {
        pincode: formData.shipping_pincode,
        book_price: bookPrice
      });
      
      setDeliveryInfo(response.data);
    } catch (err) {
      console.error("Delivery check error:", err);
      setDeliveryInfo({
        delivery_charge: 100,
        book_price: bookPrice,
        total_price: bookPrice + 100,
        min_delivery_days: 5,
        max_delivery_days: 10,
        estimated_delivery_date: null,
        message: "Using standard delivery charges"
      });
    } finally {
      setCheckingDelivery(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate("/login");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      const response = await api.post("/api/orders/create-order/", {
        book_id: id,
        order_type: "physical",
        simulate: true,
        full_name: formData.user_name,
        email: formData.email,
        phone: formData.phone,
        shipping_address: formData.shipping_address,
        shipping_city: formData.shipping_city,
        shipping_state: formData.shipping_state,
        shipping_pincode: formData.shipping_pincode,
        pincode: formData.shipping_pincode
      });
      
      if (response.data.purchased || response.data.status === "completed") {
        navigate(`/purchase-success?purchase_id=${response.data.order_id}&book=${response.data.book_title}&type=physical`);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err.response?.data?.error || "Failed to process purchase");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading || authLoading) {
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
  
  const bookPrice = parseFloat(book.physical_price || book.price || 0);

  function calcDeliveryCharge(total) {
    if (total <= 0) return 0;
    if (total < 500) return 40;
    if (total < 1000) return 30;
    return 20;
  }

  // Auto-calculate delivery charge based on book price
  const deliveryCharge = calcDeliveryCharge(bookPrice);
  const totalPrice = bookPrice + deliveryCharge;
  
  return (
    <div className="ebook-purchase-page">
      <div className="purchase-container">
        <div className="purchase-left">
          <h1>{t.title}</h1>
          
          <div className="book-summary">
            <img src={mediaUrl(book.cover_image)} alt={book.title} />
            <div className="book-info">
              <h3>{book.title}</h3>
              <p>{book.author_name || book.author?.name}</p>
              <p className="price-label">{t.price}: ₹{bookPrice}</p>
            </div>
          </div>
          
          <div className="delivery-summary">
            <h3>{t.deliveryAvailable}</h3>
            <div className="delivery-details">
              <div className="delivery-row">
                <span>{t.price}:</span>
                <span>₹{bookPrice}</span>
              </div>
              <div className="delivery-row">
                <span>{t.deliveryCharge}:</span>
                <span>₹{deliveryCharge}</span>
              </div>
              <div className="delivery-row total">
                <span>{t.totalPrice}:</span>
                <span>₹{totalPrice}</span>
              </div>
              {deliveryInfo?.estimated_delivery_date && (
                <div className="delivery-row">
                  <span>{t.estimatedDelivery}:</span>
                  <span>{new Date(deliveryInfo.estimated_delivery_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="purchase-right">
          <h2>{t.customerDetails}</h2>
          
          <form onSubmit={handleSubmit} className="purchase-form">
            <div className="form-group">
              <label>{t.fullName}</label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t.phone}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t.address}</label>
              <textarea
                name="shipping_address"
                value={formData.shipping_address}
                onChange={handleChange}
                required
                rows="2"
              />
            </div>
            
            <div className="form-group">
              <label>{t.city}</label>
              <input
                type="text"
                name="shipping_city"
                value={formData.shipping_city}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>{t.state}</label>
              <input
                type="text"
                name="shipping_state"
                value={formData.shipping_state}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group pincode-group">
              <label>{t.pincode}</label>
              <div className="pincode-input-group">
                <input
                  type="text"
                  name="shipping_pincode"
                  value={formData.shipping_pincode}
                  onChange={handleChange}
                  required
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
                <button
                  type="button"
                  className="btn-check-delivery"
                  onClick={checkDelivery}
                  disabled={checkingDelivery || !formData.shipping_pincode}
                >
                  {checkingDelivery ? t.checkingDeliveryInfo : t.checkDelivery}
                </button>
              </div>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <button 
              type="submit" 
              className="btn-proceed"
              disabled={submitting}
            >
              {submitting ? t.processing : `${t.proceedToPay} (₹${totalPrice})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
