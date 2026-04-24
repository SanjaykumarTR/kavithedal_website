/**
 * Resolve a media file URL from the Django backend.
 * - If the value is already an absolute URL (Cloudinary, etc.) → return as-is
 * - If it's a relative path like /media/books/covers/x.jpg → prepend backend base URL
 * - If it's empty/null → return the fallback placeholder image
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PLACEHOLDER = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop";

export function mediaUrl(path, fallback = PLACEHOLDER) {
  if (!path) return fallback;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}
