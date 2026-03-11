import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const NavIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const initials = user
    ? (user.first_name?.[0] || "") + (user.last_name?.[0] || user.email?.[0] || "")
    : "A";

  const navSections = [
    {
      section: t("nav", "overview"),
      links: [
        { to: "/admin/dashboard", label: t("nav", "dashboard"), icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
      ],
    },
    {
      section: t("nav", "catalogue"),
      links: [
        { to: "/admin/books", label: t("nav", "books"), icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
        { to: "/admin/authors", label: t("nav", "authors"), icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
      ],
    },
    {
      section: t("nav", "orders"),
      links: [
        { to: "/admin/orders", label: t("nav", "orders") || "Orders", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
      ],
    },
    {
      section: t("nav", "community"),
      links: [
        { to: "/admin/testimonials", label: t("nav", "testimonials"), icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" },
        { to: "/admin/contests", label: t("nav", "contests"), icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
      ],
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>Kavithedal Publications</h2>
          <p>{t("nav", "adminDashboard")}</p>
        </div>

        <nav className="admin-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.section}>
              <div className="admin-sidebar-section">{section.section}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `admin-sidebar-link${isActive ? " active" : ""}`
                  }
                >
                  <NavIcon d={link.icon} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* View Website Button */}
        <div className="admin-view-website">
          <Link to="/" className="admin-view-website-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {language === "en" ? "View Website" : "வலைதளத்தைக் காண்க"}
          </Link>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{initials.toUpperCase()}</div>
            <div>
              <p>{user?.first_name || user?.username}</p>
              <span>{user?.email}</span>
            </div>
          </div>
          
          {/* Language Toggle Button */}
          <button 
            className="admin-language-toggle" 
            onClick={toggleLanguage}
            title={language === "en" ? "Switch to Tamil" : "Switch to English"}
          >
            <span className="language-flag">{language === "en" ? "🇮🇳" : "🇬🇧"}</span>
            <span className="language-text">{language === "en" ? "தமிழ்" : "English"}</span>
          </button>
          
          <button className="admin-logout-btn" onClick={handleLogout}>
            {t("nav", "signOut")}
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
