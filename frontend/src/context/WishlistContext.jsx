import { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();

  // wishlist = array of WishlistSerializer objects: { id, book: {...}, created_at }
  const [wishlist, setWishlist] = useState([]);
  // wishlistIds = Set of book id strings for O(1) lookup
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // ── Fetch wishlist from backend whenever auth state changes ─────────────────
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      setWishlistIds(new Set());
      return;
    }
    try {
      const res = await api.get("/api/wishlist/");
      const items = res.data;
      setWishlist(items);
      setWishlistIds(new Set(items.map((item) => String(item.book.id))));
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // ── Toggle add / remove ──────────────────────────────────────────────────────
  const toggleWishlist = async (book) => {
    const bookId = String(book.id || book.book?.id);
    const inWishlist = wishlistIds.has(bookId);

    if (inWishlist) {
      // Optimistic removal
      setWishlist((prev) =>
        prev.filter((item) => String(item.book.id) !== bookId)
      );
      setWishlistIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });
      try {
        await api.delete("/api/wishlist/", { data: { book_id: bookId } });
      } catch (err) {
        console.error("Failed to remove from wishlist:", err);
        fetchWishlist(); // re-sync on error
      }
    } else {
      // Optimistic add — use whatever book shape is available
      const optimisticItem = {
        id: `temp-${bookId}`,
        book: book.book ?? book,
        created_at: new Date().toISOString(),
      };
      setWishlist((prev) => [optimisticItem, ...prev]);
      setWishlistIds((prev) => new Set([...prev, bookId]));
      try {
        const res = await api.post("/api/wishlist/", { book_id: bookId });
        // Replace temp item with the real server response
        setWishlist((prev) =>
          prev.map((item) =>
            item.id === `temp-${bookId}` ? res.data : item
          )
        );
      } catch (err) {
        console.error("Failed to add to wishlist:", err);
        fetchWishlist(); // re-sync on error
      }
    }
  };

  const isInWishlist = (bookId) => wishlistIds.has(String(bookId));

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isInWishlist, wishlistCount, fetchWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
