import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      
      // Clean up existing cart items - fix any author objects to strings
      const cleaned = (parsed || []).map(item => {
        if (!item || typeof item !== 'object' || !item.id) return null;
        
        // Fix author if it's an object
        let authorName = '';
        if (item.author) {
          authorName = typeof item.author === 'object' ? (item.author?.name || '') : String(item.author);
        }
        
        return {
          ...item,
          id: String(item.id),
          title: String(item.title || ''),
          author: String(authorName),
          category: String(item.category || ''),
          image: String(item.image || ''),
          book_type: String(item.book_type || 'physical'),
          qty: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          oldPrice: Number(item.oldPrice) || 0,
          discount: Number(item.discount) || 0
        };
      }).filter(Boolean);
      
      return cleaned;
    } catch (e) {
      console.error("Error parsing cart from localStorage:", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving cart to localStorage:", e);
    }
  }, [cart]);

  const addToCart = (book) => {
    try {
      // Validate book object
      if (!book || !book.id || !book.title) {
        console.error("Invalid book object:", book);
        return;
      }
      
      setCart((prev) => {
        const exists = prev.find((item) => item.id === book.id);
        if (exists) {
          return prev.map((item) =>
            item.id === book.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        
        // Get price - check multiple sources for price
        let price = parseFloat(book.ebook_price) || parseFloat(book.price) || parseFloat(book.physical_price) || 0;
        let oldPrice = price;
        let discount = 0;
        
        if (book.discount_percentage && book.discount_percentage > 0) {
          discount = parseFloat(book.discount_percentage);
          const discountAmount = (price * discount) / 100;
          price = price - discountAmount;
        }
        
        // Get author name - IMPORTANT: extract as string, not object
        let authorName = '';
        if (book.author) {
          authorName = typeof book.author === 'object' ? (book.author.name || '') : String(book.author);
        } else if (book.author_name) {
          authorName = book.author_name;
        } else if (book.authorName) {
          authorName = book.authorName;
        }
        
        // Get cover image
        const coverImage = book.image || book.cover_image || book.coverImage || '';
        
        // Get category
        const category = book.category || '';
        
        const newItem = {
          id: String(book.id),
          title: String(book.title || ''),
          author: String(authorName),
          category: String(category),
          image: String(coverImage),
          book_type: String(book.book_type || 'physical'),
          qty: 1,
          price: Math.round(price * 100) / 100,
          oldPrice: Math.round(oldPrice * 100) / 100,
          discount: Math.round(discount * 100) / 100
        };
        
        return [...prev, newItem];
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const removeFromCart = (bookId) => {
    setCart((prev) => prev.filter((item) => item.id !== bookId));
  };

  const updateQuantity = (bookId, newQty) => {
    if (newQty < 1) {
      removeFromCart(bookId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === bookId ? { ...item, qty: newQty } : item
      )
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
