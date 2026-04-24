import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EMPTY_FORM = {
  name: "", biography: "", email: "", mobile_number: "",
  website: "", twitter: "", instagram: "", facebook: "",
  photo: null,
};

export default function AdminAuthors() {
  const { t } = useTranslation();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [authorBooks, setAuthorBooks] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("/api/authors/");

  const fetchAuthors = useCallback(async (url = "/api/authors/") => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const res = await api.get(url, { params: search ? params : {} });
      const data = res.data;
      setAuthors(data.results ?? data);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch {
      setError(t("errors", "failedToLoadAuthors"));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => { fetchAuthors(currentUrl); }, [currentUrl]);

  const openCreate = () => { setForm(EMPTY_FORM); setError(""); setModal("create"); };
  const openEdit = async (author) => {
    setSelected(author);
    setForm({
      name: author.name, biography: author.biography, email: author.email,
      mobile_number: author.mobile_number || "",
      website: author.website || "", twitter: author.twitter || "",
      instagram: author.instagram || "", facebook: author.facebook || "",
      photo: null,
    });
    // Fetch books by this author
    try {
      const res = await api.get(`/api/authors/${author.id}/books/`);
      setAuthorBooks(res.data.results || res.data);
    } catch (err) {
      setAuthorBooks([]);
    }
    setError("");
    setModal("edit");
  };
  const openDelete = (author) => { setSelected(author); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((p) => ({ ...p, [name]: files ? files[0] : value }));
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== undefined) {
        // Always include the field - this allows clearing fields by sending empty string
        fd.append(k, v);
      }
    });
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError(t("errors", "nameRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = buildFormData();
      if (modal === "create") {
        await api.post("/api/authors/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.patch(`/api/authors/${selected.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      closeModal();
      fetchAuthors(currentUrl);
    } catch (err) {
      const msgs = err.response?.data;
      setError(msgs ? Object.values(msgs).flat().join(" ") : t("errors", "somethingWentWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/api/authors/${selected.id}/`);
      closeModal();
      fetchAuthors(currentUrl);
    } catch {
      setError(t("errors", "failedToDeleteAuthor"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentUrl("/api/authors/");
    fetchAuthors("/api/authors/");
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{t("authors", "title")}</h1>
          <p>{t("authors", "manageAllAuthors")}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + {t("authors", "addAuthor")}
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-toolbar">
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1 }}>
            <input
              className="admin-search"
              placeholder={t("authors", "searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="admin-btn admin-btn-secondary" type="submit">{t("common", "search")}</button>
          </form>
        </div>

        {loading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : authors.length === 0 ? (
          <div className="admin-empty"><p>{t("authors", "noAuthorsFound")}</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("authors", "photo")}</th>
                    <th>{t("authors", "name")}</th>
                    <th>{t("authors", "email")}</th>
                    <th>{t("authors", "mobileNumber")}</th>
                    <th>{t("authors", "books")}</th>
                    <th>{t("common", "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.photo ? (
                          <img src={a.photo.startsWith('http') ? a.photo : `${API_BASE}${a.photo}`} alt={a.name} className="admin-table-img" />
                        ) : (
                          <div className="admin-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                            {a.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td><strong>{a.name}</strong></td>
                      <td>{a.email}</td>
                      <td>{a.mobile_number || "-"}</td>
                      <td>
                        <span className="admin-badge admin-badge-info" style={{ display: 'inline-block', padding: '4px 10px', fontWeight: 'bold' }}>
                          {Number(a.books_count) || 0}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(a)}>{t("common", "edit")}</button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => openDelete(a)}>{t("common", "delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={!prevPage} onClick={() => { setCurrentUrl(prevPage.replace(API_BASE, "")); }}>← {t("common", "prev")}</button>
              <button disabled={!nextPage} onClick={() => { setCurrentUrl(nextPage.replace(API_BASE, "")); }}>{t("common", "next")} →</button>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "create" ? t("authors", "addNewAuthor") : t("authors", "editAuthor")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "fullNameLabel")}</label>
                    <input className="admin-form-input" name="name" value={form.name} onChange={handleChange} placeholder={t("authors", "namePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "emailLabel")}</label>
                    <input className="admin-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder={t("authors", "emailPlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "mobileNumberLabel")}</label>
                    <input className="admin-form-input" type="tel" name="mobile_number" value={form.mobile_number} onChange={handleChange} placeholder={t("authors", "mobileNumberPlaceholder")} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("authors", "biographyLabel")}</label>
                    <textarea className="admin-form-textarea" name="biography" value={form.biography} onChange={handleChange} placeholder={t("authors", "biographyPlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "photoLabel")}</label>
                    <input className="admin-form-input" type="file" name="photo" accept="image/*" onChange={handleChange} />
                    {selected?.photo && !form.photo && (
                      <img src={`${API_BASE}${selected.photo}`} alt="" className="admin-img-preview" style={{ marginTop: 8 }} />
                    )}
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "websiteLabel")}</label>
                    <input className="admin-form-input" name="website" value={form.website} onChange={handleChange} placeholder={t("authors", "websitePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "twitterLabel")}</label>
                    <input className="admin-form-input" name="twitter" value={form.twitter} onChange={handleChange} placeholder={t("authors", "twitterPlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "instagramLabel")}</label>
                    <input className="admin-form-input" name="instagram" value={form.instagram} onChange={handleChange} placeholder={t("authors", "instagramPlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("authors", "facebookLabel")}</label>
                    <input className="admin-form-input" name="facebook" value={form.facebook} onChange={handleChange} placeholder={t("authors", "facebookPlaceholder")} />
                  </div>
                  {modal === "edit" && authorBooks.length > 0 && (
                    <div className="admin-form-group full">
                      <label className="admin-form-label">Books by this Author</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {authorBooks.map((book) => (
                          <span key={book.id} className="admin-badge admin-badge-info" style={{ padding: '6px 12px' }}>
                            {book.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>{t("common", "cancel")}</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? t("common", "saving") : modal === "create" ? t("authors", "createAuthor") : t("authors", "saveChangesAuthor")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{t("authors", "deleteAuthor")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 15 }}>
                {t("authors", "deleteConfirm", { name: selected?.name })}
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={closeModal}>{t("common", "cancel")}</button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? t("common", "deleting") : t("common", "delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
