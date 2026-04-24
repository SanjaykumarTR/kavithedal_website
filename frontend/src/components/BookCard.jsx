import { useState, useContext } from "react";
import { LanguageContext } from "../context/LanguageContext";
import "../styles/bookcard.css";

export default function BookCard({ book }) {
  const { language } = useContext(LanguageContext);
  const [quantity, setQuantity] = useState(1);

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(book.rating);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i}>⭐</span>);
    }

    return stars;
  };

  const increaseQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="book-card">
      <img src={book.image} alt={book.title} />

      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="author">✍ {book.author}</p>

        <div className="rating">
          {renderStars()}
          <span className="rating-number">{book.rating}</span>
        </div>

        {/* PRICE */}
        <div className="price">
          ₹ {book.price}
        </div>

        {/* QUANTITY CONTROL */}
        <div className="quantity-control">
          <button onClick={decreaseQty}>−</button>
          <span>{quantity}</span>
          <button onClick={increaseQty}>+</button>
        </div>

        {/* TOTAL + ADD BUTTON */}
        <div className="price-section">
          <span className="total-price">
            ₹ {book.price * quantity}
          </span>
          <button className="add-btn">
            {language === "en" ? "Add to Cart" : "சேர்க்க"}
          </button>
        </div>
      </div>
    </div>
  );
}
