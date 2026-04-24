import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  // Check both auth_user and admin_user for admin login
  const authUser = localStorage.getItem("auth_user") || localStorage.getItem("admin_user");
  const token = localStorage.getItem("access_token");
  
  // If no token or user, redirect to login
  if (!token || !authUser) {
    return <Navigate to="/login" replace />;
  }
  
  let user = null;
  try {
    user = JSON.parse(authUser);
  } catch {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is admin
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  
  if (!isAdmin) {
    // Regular user tried to access admin area
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
}
