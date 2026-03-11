import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    books: 0,
    authors: 0,
    testimonials: 0,
    pendingTestimonials: 0,
    contests: 0,
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [recentTestimonials, setRecentTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [booksRes, authorsRes, testimonialsRes, pendingRes, contestsRes] =
          await Promise.all([
            api.get("/api/books/?page_size=5"),
            api.get("/api/authors/"),
            api.get("/api/testimonials/"),
            api.get("/api/testimonials/?status=pending"),
            api.get("/api/contests/?is_active=true"),
          ]);

        setStats({
          books: booksRes.data.count ?? booksRes.data.length ?? 0,
          authors: authorsRes.data.count ?? authorsRes.data.length ?? 0,
          testimonials: testimonialsRes.data.count ?? testimonialsRes.data.length ?? 0,
          pendingTestimonials: pendingRes.data.count ?? pendingRes.data.length ?? 0,
          contests: contestsRes.data.count ?? contestsRes.data.length ?? 0,
        });

        const books = booksRes.data.results ?? booksRes.data;
        setRecentBooks(books.slice(0, 5));

        const testimonials = testimonialsRes.data.results ?? testimonialsRes.data;
        setRecentTestimonials(testimonials.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { key: "books", label: t("dashboard", "totalBooks"), icon: "📚", color: "blue" },
    { key: "authors", label: t("dashboard", "totalAuthors"), icon: "✍️", color: "green" },
    { key: "testimonials", label: t("dashboard", "testimonials"), icon: "💬", color: "orange" },
    { key: "pendingTestimonials", label: t("dashboard", "pendingApproval"), icon: "⏳", color: "red" },
    { key: "contests", label: t("dashboard", "activeContests"), icon: "🏆", color: "purple" },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-loading">
          <div className="admin-spinner" />
          <p>{t("common", "loading")}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{t("dashboard", "title")}</h1>
          <p>{t("dashboard", "welcomeBack")}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="admin-stats-grid">
        {statCards.map(({ key, label, icon, color }) => (
          <div key={key} className="admin-stat-card">
            <div className={`admin-stat-icon ${color}`}>{icon}</div>
            <div>
              <h3>{stats[key]}</h3>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="admin-recent-grid">
        {/* Recent Books */}
        <div className="admin-card admin-recent-card">
          <h3>
            {t("dashboard", "recentBooks")}
            <Link to="/admin/books" className="admin-btn admin-btn-secondary admin-btn-sm">
              {t("common", "viewAll")}
            </Link>
          </h3>
          {recentBooks.length === 0 ? (
            <div className="admin-empty"><p>{t("dashboard", "noBooksYet")}</p></div>
          ) : (
            recentBooks.map((book) => (
              <div key={book.id} className="admin-recent-item">
                {book.cover_image && (
                  <img
                    src={book.cover_image}
                    alt={book.title}
                    className="admin-table-img"
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p>{book.title}</p>
                  <span>{book.author?.name}</span>
                </div>
                <span className="admin-badge admin-badge-default">
                  {book.category_display}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent Testimonials */}
        <div className="admin-card admin-recent-card">
          <h3>
            {t("dashboard", "recentTestimonials")}
            <Link to="/admin/testimonials" className="admin-btn admin-btn-secondary admin-btn-sm">
              {t("common", "viewAll")}
            </Link>
          </h3>
          {recentTestimonials.length === 0 ? (
            <div className="admin-empty"><p>{t("dashboard", "noTestimonialsYet")}</p></div>
          ) : (
            recentTestimonials.map((item) => (
              <div key={item.id} className="admin-recent-item">
                <div className="admin-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                  {item.name[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p>{item.name}</p>
                  <span>{"★".repeat(item.rating)}</span>
                </div>
                <span
                  className={`admin-badge ${
                    item.status === "approved" ? "admin-badge-success" : "admin-badge-warning"
                  }`}
                >
                  {item.status_display}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
