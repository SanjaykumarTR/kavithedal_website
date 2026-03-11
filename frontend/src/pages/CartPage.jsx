import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/cart.css";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartCount } = useContext(CartContext);
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const subtotal = Math.round(cart.reduce((sum, item) => sum + item.price * item.qty, 0) * 100) / 100;
  const shipping = subtotal > 0 && subtotal < 500 ? 50 : 0;
  const total = Math.round((subtotal + shipping) * 100) / 100;

  const handlePayment = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert(language === "en" ? "Please login to purchase" : "Login to purchase");
      navigate("/login");
      return;
    }

    if (cart.length === 0) {
      alert(language === "en" ? "Your cart is empty" : "Cart is empty");
      return;
    }

    setLoading(true);

    try {
      // First, load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert(language === "en" ? "Failed to load Razorpay" : "Failed to load payment");
        setLoading(false);
        return;
      }

      // Create order on backend
      const itemsForBackend = cart.map(item => ({
        book_id: item.id,
        qty: item.qty,
        price: item.price
      }));

      const orderResponse = await api.post("/api/orders/cart-checkout/", {
        items: itemsForBackend,
        total_amount: total
      });

      const { razorpay_order_id, key_id } = orderResponse.data;

      // Open Razorpay checkout
      const options = {
        key: key_id,
        amount: total * 100,
        currency: "INR",
        name: "Kavithedal Publications",
        description: cartCount + " Book(s) Purchase",
        order_id: razorpay_order_id,
        handler: async function (response) {
          // Payment successful - verify with backend
          try {
            const verifyResponse = await api.post("/api/orders/cart-verify-payment/", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              razorpay_order_id: razorpay_order_id,
              items: itemsForBackend,
              total_amount: total
            });

            if (verifyResponse.data.status === "Payment successful") {
              alert("Payment Successful! Order IDs: " + verifyResponse.data.order_ids.join(", "));
              // Clear cart after successful payment
              cart.forEach(item => removeFromCart(item.id));
              navigate("/user-dashboard");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            alert(language === "en" ? "Payment verification failed" : "Payment failed");
          }
        },
        prefill: {
          name: user?.first_name ? user.first_name + " " + (user.last_name || "") : "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          address: "Kavithedal Publications, Tamil Nadu",
        },
        theme: {
          color: "#B71C1C",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
      });
      rzp.open();

    } catch (error) {
      console.error("Payment error:", error);
      alert(language === "en" ? "Failed to initiate payment" : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h2 className="page-title">
          {language === "en" ? "Your Cart" : "Your Cart"}
        </h2>
        {cart.length > 0 && (
          <p className="cart-count">
            {cartCount} {language === "en" ? "item(s)" : "items"}
          </p>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">Cart</div>
          <h3>
            {language === "en" ? "Your cart is empty" : "Cart is empty"}
          </h3>
          <p>
            {language === "en" ? "Add some books to your cart" : "Add books to cart"}
          </p>
          <Link to="/books" className="browse-btn">
            {language === "en" ? "Browse Books" : "Browse"}
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* CART ITEMS LIST */}
          <div className="cart-items-section">
            <h3 className="section-label">
              {language === "en" ? "Items in Cart" : "Cart Items"}
            </h3>
            {cart.map((item) => (
              <div key={item.id} className="cart-item-card">
                <img 
                  src={item.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop"} 
                  alt={item.title} 
                  className="ci-img" 
                />
                <div className="ci-details">
                  <h4 className="ci-title">{item.title}</h4>
                  <p className="ci-author">{item.author}</p>
                  <span className="ci-category">{item.category}</span>
                  <div className="ci-price-row">
                    <span className="ci-price">Rs.{item.price.toFixed(2)}</span>
                    <span className="ci-old-price">Rs.{item.oldPrice.toFixed(2)}</span>
                    <span className="ci-discount">-{item.discount}%</span>
                  </div>
                  <div className="ci-qty-row">
                    <span className="ci-qty-label">
                      {language === "en" ? "Qty" : "Qty"}:
                    </span>
                    <div className="ci-qty-controls">
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                      >-</button>
                      <span className="ci-qty">{item.qty}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                      >+</button>
                    </div>
                    <span className="ci-subtotal">
                      = Rs.{(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  className="ci-remove-btn"
                  onClick={() => removeFromCart(item.id)}
                  title={language === "en" ? "Remove" : "Remove"}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          {/* ORDER SUMMARY */}
          <div className="cart-summary">
            <h3 className="summary-title">
              {language === "en" ? "Order Summary" : "Summary"}
            </h3>

            <div className="summary-row">
              <span>{language === "en" ? "Subtotal" : "Subtotal"}</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row">
              <span>
                {language === "en" ? "Shipping" : "Shipping"}
              </span>
              <span className={shipping === 0 ? "free-tag" : ""}>
                {shipping === 0
                  ? language === "en"
                    ? "FREE"
                    : "FREE"
                  : "Rs." + shipping}
              </span>
            </div>

            {shipping > 0 && (
              <p className="free-ship-note">
                {language === "en"
                  ? "Add Rs." + (500 - subtotal).toFixed(2) + " more for FREE shipping"
                  : "Add Rs." + (500 - subtotal).toFixed(2) + " for FREE shipping"}
              </p>
            )}

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span className="total-label">
                {language === "en" ? "Total" : "Total"}
              </span>
              <span className="total-amount">Rs.{total.toFixed(2)}</span>
            </div>

            <button className="pay-now-btn" onClick={handlePayment} disabled={loading}>
              {loading ? "..." : "Pay Now with Razorpay"}
            </button>

            <div className="razorpay-info">
              <span className="secure-icon">Secure</span>
              <span>
                100% Secure Payment via Razorpay
              </span>
            </div>

            <div className="payment-methods">
              <span>UPI</span>
              <span>Cards</span>
              <span>NetBanking</span>
              <span>Wallets</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
