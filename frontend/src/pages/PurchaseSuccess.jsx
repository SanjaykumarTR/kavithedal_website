import { useSearchParams, Link } from "react-router-dom";
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/bookDetail.css";

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const { language } = useContext(LanguageContext);
  
  const purchaseId = searchParams.get("purchase_id");
  const bookTitle = searchParams.get("book") || "your eBook";
  
  const translations = {
    en: {
      title: "Purchase Successful!",
      message: "Thank you for your purchase. Your eBook has been added to your library.",
      purchaseId: "Purchase ID",
      bookName: "Book",
      thankYou: "Thank you for shopping with Kavithedal Publications!",
      goToLibrary: "Go to Library",
      backToHome: "Back to Home"
    },
    ta: {
      title: "வாங்கியது வெற்றியாக உள்ளது!",
      message: "உங்கள் வாங்குதலுக்கு நன்றி. உங்கள் இ-புத்தகம் உங்கள் நூலகத்தில் சேர்க்கப்பட்டது.",
      purchaseId: "வாங்குதல் ID",
      bookName: "புத்தகம்",
      thankYou: "கவித்தேல் பதிப்பகத்தில் வாங்கியதற்கு நன்றி!",
      goToLibrary: "நூலகத்திற்கு செல்",
      backToHome: "முகப்பு பக்கம்"
    }
  };
  
  const t = translations[language];
  
  return (
    <div className="purchase-success-page">
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h1>{t.title}</h1>
        <p className="success-message">{t.message}</p>
        
        <div className="order-details">
          {purchaseId && (
            <p><strong>{t.purchaseId}:</strong> {purchaseId}</p>
          )}
          <p><strong>{t.bookName}:</strong> {bookTitle}</p>
        </div>
        
        <p className="thank-you">{t.thankYou}</p>
        
        <div className="success-actions">
          <Link to="/library" className="btn-success">
            {t.goToLibrary}
          </Link>
          <Link to="/" className="btn-secondary">
            {t.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
