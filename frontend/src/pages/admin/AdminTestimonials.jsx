import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const EMPTY_FORM = { name: "", role: "reader", message: "", rating: 5, status: "pending", has_video: false, video_type: "none", video_url: "", video_file: null };

export default function AdminTestimonials() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchItems = useCallback(async (url = "/api/testimonials/") => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get(url, { params });
      const data = res.data;
      setItems(data.results ?? data);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch {
      setError(t("errors", "failedToLoadTestimonials"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => { fetchItems(); }, [statusFilter]);

  const openCreate = () => { setForm(EMPTY_FORM); setError(""); setModal("create"); };
  const openEdit = (item) => {
    setSelected(item);
    setForm({ 
      name: item.name, 
      role: item.role, 
      message: item.message, 
      rating: item.rating, 
      status: item.status,
      has_video: item.has_video || false,
      video_type: item.video_type || "none",
      video_url: item.video_url || "",
      video_file: null
    });
    setError("");
    setModal("edit");
  };
  const openDelete = (item) => { setSelected(item); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ 
      ...p, 
      [name]: type === "checkbox" ? checked : name === "rating" ? parseInt(value) : value 
    }));
  };

  const quickApprove = async (id) => {
    try {
      await api.patch(`/api/testimonials/${id}/`, { status: "approved" });
      fetchItems();
    } catch {
      alert(t("errors", "failedToApprove"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) {
      setError(t("errors", "requiredFieldsTestimonial"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // Use FormData for file uploads
      if (form.video_file) {
        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("role", form.role);
        formData.append("message", form.message);
        formData.append("rating", form.rating);
        formData.append("status", form.status);
        formData.append("has_video", form.has_video);
        formData.append("video_type", form.video_type);
        formData.append("video_file", form.video_file);
        
        if (modal === "create") {
          await api.post("/api/testimonials/", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } else {
          await api.patch(`/api/testimonials/${selected.id}/`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }
      } else {
        if (modal === "create") {
          await api.post("/api/testimonials/", form);
        } else {
          await api.patch(`/api/testimonials/${selected.id}/`, form);
        }
      }
      closeModal();
      fetchItems();
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
      await api.delete(`/api/testimonials/${selected.id}/`);
      closeModal();
      fetchItems();
    } catch {
      setError(t("errors", "failedToDelete"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{t("testimonials", "title")}</h1>
          <p>{t("testimonials", "manageTestimonials")}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ {t("testimonials", "addTestimonial")}</button>
      </div>

      <div className="admin-card">
        <div className="admin-table-toolbar">
          <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t("testimonials", "allStatus")}</option>
            <option value="pending">{t("common", "pending")}</option>
            <option value="approved">{t("common", "approved")}</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : items.length === 0 ? (
          <div className="admin-empty"><p>{t("testimonials", "noTestimonialsFound")}</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("testimonials", "name")}</th>
                    <th>{t("testimonials", "role")}</th>
                    <th>{t("testimonials", "message")}</th>
                    <th>{t("testimonials", "rating")}</th>
                    <th>{t("testimonials", "video") || "Video"}</th>
                    <th>{t("common", "status")}</th>
                    <th>{t("testimonials", "date")}</th>
                    <th>{t("common", "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className={`admin-badge ${item.role === "author" ? "admin-badge-info" : "admin-badge-default"}`}>
                          {item.role_display}
                        </span>
                      </td>
                      <td style={{ maxWidth: 220 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.message}
                        </span>
                      </td>
                      <td><span className="admin-stars">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span></td>
                      <td>
                        {item.has_video ? (
                          <span className="admin-badge admin-badge-info">📹 {item.video_type || "Video"}</span>
                        ) : (
                          <span className="admin-badge admin-badge-default">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${item.status === "approved" ? "admin-badge-success" : "admin-badge-warning"}`}>
                          {item.status_display}
                        </span>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-table-actions">
                          {item.status === "pending" && (
                            <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => quickApprove(item.id)}>
                              {t("testimonials", "approve")}
                            </button>
                          )}
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(item)}>{t("common", "edit")}</button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => openDelete(item)}>{t("common", "delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={!prevPage} onClick={() => fetchItems(prevPage.replace(API_BASE, ""))}>← {t("common", "prev")}</button>
              <button disabled={!nextPage} onClick={() => fetchItems(nextPage.replace(API_BASE, ""))}>{t("common", "next")} →</button>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "create" ? t("testimonials", "addTestimonialTitle") : t("testimonials", "editTestimonialTitle")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("testimonials", "nameLabel")}</label>
                    <input className="admin-form-input" name="name" value={form.name} onChange={handleChange} placeholder={t("testimonials", "namePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("testimonials", "roleLabel")}</label>
                    <select className="admin-form-select" name="role" value={form.role} onChange={handleChange}>
                      <option value="reader">{t("testimonials", "reader")}</option>
                      <option value="author">{t("testimonials", "authorRole")}</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("testimonials", "ratingLabel")}</label>
                    <select className="admin-form-select" name="rating" value={form.rating} onChange={handleChange}>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>{n} — {"★".repeat(n)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("testimonials", "statusLabel")}</label>
                    <select className="admin-form-select" name="status" value={form.status} onChange={handleChange}>
                      <option value="pending">{t("common", "pending")}</option>
                      <option value="approved">{t("common", "approved")}</option>
                    </select>
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("testimonials", "messageLabel")}</label>
                    <textarea className="admin-form-textarea" name="message" value={form.message} onChange={handleChange} placeholder={t("testimonials", "messagePlaceholder")} style={{ minHeight: 120 }} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        name="has_video" 
                        checked={form.has_video} 
                        onChange={handleChange}
                        style={{ width: "auto", margin: 0 }}
                      />
                      {t("testimonials", "includeVideo") || "Include Video"}
                    </label>
                  </div>
                  {form.has_video && (
                    <>
                      <div className="admin-form-group">
                        <label className="admin-form-label">{t("testimonials", "videoType") || "Video Type"}</label>
                        <select className="admin-form-select" name="video_type" value={form.video_type} onChange={handleChange}>
                          <option value="none">None</option>
                          <option value="youtube">YouTube</option>
                          <option value="vimeo">Vimeo</option>
                          <option value="mp4_url">MP4 URL</option>
                          <option value="mp4_file">MP4 File Upload</option>
                        </select>
                      </div>
                      {form.video_type === "mp4_url" ? (
                        <div className="admin-form-group">
                          <label className="admin-form-label">{t("testimonials", "videoUrl") || "Video URL"}</label>
                          <input 
                            className="admin-form-input" 
                            name="video_url" 
                            value={form.video_url} 
                            onChange={handleChange} 
                            placeholder="https://example.com/video.mp4"
                          />
                        </div>
                      ) : form.video_type === "mp4_file" ? (
                        <div className="admin-form-group">
                          <label className="admin-form-label">{t("testimonials", "videoFile") || "Upload MP4 Video"}</label>
                          <input 
                            type="file" 
                            accept=".mp4,video/mp4"
                            className="admin-form-input" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setForm((p) => ({ ...p, video_file: file }));
                              }
                            }}
                          />
                          {selected && selected.video_file && (
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                              Current file: {selected.video_file}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="admin-form-group">
                          <label className="admin-form-label">{t("testimonials", "videoUrl") || "Video URL"}</label>
                          <input 
                            className="admin-form-input" 
                            name="video_url" 
                            value={form.video_url} 
                            onChange={handleChange} 
                            placeholder={form.video_type === "youtube" ? "https://youtube.com/watch?v=..." : form.video_type === "vimeo" ? "https://vimeo.com/..." : "Video URL"}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>{t("common", "cancel")}</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? t("common", "saving") : modal === "create" ? t("testimonials", "createTestimonial") : t("testimonials", "saveChangesTestimonial")}
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
              <h3>{t("testimonials", "deleteTestimonial")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p>{t("testimonials", "deleteConfirm", { name: selected?.name })}</p>
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
