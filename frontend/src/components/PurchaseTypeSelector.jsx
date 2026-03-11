import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import "../styles/productCard.css";

export default function PurchaseTypeSelector({ book, onClose }) {
  const { language } = useContext(LanguageContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const translations = {
    en: {
      title: "Select Purchase Type",
      ebook: "eBook",
      physical: "Physical Book",
      ebookDesc: "Read online, instant access",
      physicalDesc: "Free shipping to your address",
      proceed: "Proceed",
      cancel: "Cancel",
      loginRequired: "Please login to purchase"
    },
    ta: {
      title: "வாங்கும் வகையைத் தேர்ந்தெடுக்கவும்",
      ebook: "இ-புத்தகம்",
      physical: "இயல்பான புத்தகம்",
      ebookDesc: "உள்ளே படி, உடனடி அணுகல்",
      physicalDesc: "உங்கள் முகவரிக்கு இலவess shipping",
      proceed: "தொடர்வது",
      cancel: "ரத்து",
      loginRequired: "வாங்க உள்நுழையவும்"
    }
  };
  
  const t = translations[language];
  const [selectedType, setSelectedType] = useState(null);
  
  const handleProceed = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (selectedType === "ebook") {
      navigate(`/ebook-purchase/${book.id}`);
    } else if (selectedType === "physical") {
      navigate(`/physical-purchase/${book.id}`);
    }
  };
  
  return (
    <div className="purchase-type-overlay" onClick={onClose}>
      <div className="purchase-type-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t.title}</h2>
        
        <div className="purchase-type-options">
          {book.ebook_price > 0 && (
            <div 
              className={`purchase-type-card ${selectedType === "ebook" ? "selected" : ""}`}
              onClick={() => setSelectedType("ebook")}
            >
              <div className="type-icon">📱</div>
              <h3>{t.ebook}</h3>
              <p className="type-price">₹{book.ebook_price}</p>
              <p className="type-desc">{t.ebookDesc}</p>
            </div>
          )}
          
          {(book.physical_price > 0 || book.price > 0) && (
            <div 
              className={`purchase-type-card ${selectedType === "physical" ? "selected" : ""}`}
              onClick={() => setSelectedType("physical")}
            >
              <div className="type-icon">📦</div>
              <h3>{t.physical}</h3>
              <p className="type-price">₹{book.physical_price || book.price}</p>
              <p className="type-desc">{t.physicalDesc}</p>
            </div>
          )}
        </div>
        
        <div className="purchase-type-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t.cancel}
          </button>
          <button 
            className="btn-proceed" 
            onClick={handleProceed}
            disabled={!selectedType}
          >
            {t.proceed}
          </button>
        </div>
      </div>
    </div>
  );
}
