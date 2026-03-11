import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  // If still loading, wait for auth to initialize
  if (loading) {
    return null; // or a loading spinner
  }
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is admin - redirect to admin dashboard
  if (user?.role === "admin" || user?.role === "superadmin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
