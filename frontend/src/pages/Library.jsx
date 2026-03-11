import { useState, useEffect, useContext } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { getUserLibrary, getUserOrders } from "../api/orders";
import "../styles/library.css";

export default function Library() {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get user from localStorage directly
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Redirect to login if no user
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);
  
  const [library, setLibrary] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("library");
  
  const translations = {
    en: {
      myLibrary: "My Library",
      myOrders: "My Orders",
      noBooks: "You don't have any books in your library yet",
      noOrders: "You don't have any orders yet",
      purchasedOn: "Purchased on",
      readNow: "Read Now",
      viewDetails: "View Details",
      orderStatus: "Status",
      deliveryStatus: "Delivery",
      tracking: "Tracking",
      price: "Price"
    },
    ta: {
      myLibrary: "என் நூலகம்",
      myOrders: "என் ஆணைகள்",
      noBooks: "உங்கள் நூலகத்தில் இன்னும் புத்தகங்கள் இல்லை",
      noOrders: "இன்னும் ஆணைகள் இல்லை",
      purchasedOn: "வாங்கிய தேதி",
      readNow: "இப்போது படி",
      viewDetails: "விளக்கங்களை காண்க",
      orderStatus: "நிலை",
      deliveryStatus: "Delivery",
      tracking: "Tracking",
      price: "விலை"
    }
  };
  
  const t = translations[language];
  
  useEffect(() => {
    if (user) {
      fetchData();
      // Check if we should show orders tab (from purchase redirect)
      const tab = searchParams.get('tab');
      if (tab === 'orders') {
        setActiveTab('orders');
      }
    }
  }, [user, searchParams]);
  
  const fetchData = async () => {
    try {
      const [libraryData, ordersData] = await Promise.all([
        getUserLibrary(),
        getUserOrders()
      ]);
      setLibrary(libraryData.results || libraryData);
      setOrders(ordersData.results || ordersData);
    } catch (error) {
      console.error("Failed to fetch library/orders:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(
      language === "ta" ? "ta-IN" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: "#FFA000",
      processing: "#1976D2",
      completed: "#388E3C",
      cancelled: "#D32F2F",
      refunded: "#7B1FA2"
    };
    return colors[status] || "#757575";
  };
  
  const getDeliveryColor = (status) => {
    const colors = {
      pending: "#FFA000",
      packed: "#1976D2",
      shipped: "#7B1FA2",
      delivered: "#388E3C"
    };
    return colors[status] || "#757575";
  };
  
  if (!user) {
    return (
      <div className="library-page">
        <div className="library-auth-required">
          <h2>{language === "en" ? "Please login to view your library" : "உங்கள் நூலகத்தைக் காண உள்நுழையவும்"}</h2>
          <Link to="/login" className="btn-login">
            {language === "en" ? "Login" : "உள்நுழை"}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="library-page">
      <div className="library-header">
        <h1>{language === "en" ? "My Account" : "என் கணக்கு"}</h1>
      </div>
      
      <div className="library-tabs">
        <button 
          className={`tab-btn ${activeTab === "library" ? "active" : ""}`}
          onClick={() => setActiveTab("library")}
        >
          {t.myLibrary}
        </button>
        <button 
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          {t.myOrders}
        </button>
      </div>
      
      {loading ? (
        <div className="library-loading">
          <div className="spinner"></div>
        </div>
      ) : activeTab === "library" ? (
        <div className="library-content">
          {library.length === 0 ? (
            <div className="empty-state">
              <p>{t.noBooks}</p>
              <Link to="/books" className="btn-browse">
                {language === "en" ? "Browse Books" : "புத்தகங்களைப் பார்க்க"}
              </Link>
            </div>
          ) : (
            <div className="library-grid">
              {library.map((item) => (
                <div key={item.id} className="library-card">
                  <img 
                    src={item.book_cover} 
                    alt={item.book_title}
                    className="library-cover"
                  />
                  <div className="library-info">
                    <h3>{item.book_title}</h3>
                    <p className="library-author">{item.book_author}</p>
                    <p className="library-date">
                      {t.purchasedOn}: {formatDate(item.purchased_at)}
                    </p>
                    {item.has_pdf && (
                      <Link to={`/reader/${item.book_id}`} className="btn-read">
                        {t.readNow}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="orders-content">
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>{t.noOrders}</p>
              <Link to="/books" className="btn-browse">
                {language === "en" ? "Browse Books" : "புத்தகங்களைப் பார்க்க"}
              </Link>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-image">
                    <img src={order.book_cover} alt={order.book_title} />
                  </div>
                  <div className="order-details">
                    <h3>{order.book_title}</h3>
                    <p className="order-type">
                      {order.order_type === "ebook" ? "eBook" : "Physical Book"}
                    </p>
                    <p className="order-price">
                      {t.price}: ₹{order.total_price}
                    </p>
                    <p className="order-date">
                      {formatDate(order.ordered_at)}
                    </p>
                  </div>
                  <div className="order-status">
                    <div className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                      {order.status}
                    </div>
                    {order.order_type === "physical" && (
                      <div className="delivery-badge" style={{ backgroundColor: getDeliveryColor(order.delivery_status) }}>
                        {order.delivery_status}
                      </div>
                    )}
                    {order.tracking_number && (
                      <p className="tracking">
                        {t.tracking}: {order.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
