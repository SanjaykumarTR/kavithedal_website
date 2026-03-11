import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("auth_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("auth_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/api/login/", { email, password });
    
    // Check if OTP is required
    if (response.data.requires_otp) {
      localStorage.setItem("pending_admin_email", response.data.email);
      throw new Error("OTP_REQUIRED");
    }
    
    const { access, refresh, user: userData } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("admin_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const loginWithOTP = async (email, otpCode) => {
    const response = await api.post("/api/verify-otp/", {
      email,
      otp_code: otpCode,
    });
    
    const { access, refresh, user: userData } = response.data;
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("admin_user", JSON.stringify(userData));
    localStorage.removeItem("pending_admin_email");
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await api.post("/api/logout/", { refresh });
      }
    } catch {
      // ignore errors on logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("pending_admin_email");
      setUser(null);
    }
  };

  // Role helpers
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isUser = user?.role === "user" || !user?.role;

  return (
    <AuthContext.Provider value={{ user, login, loginWithOTP, logout, loading: loading, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
