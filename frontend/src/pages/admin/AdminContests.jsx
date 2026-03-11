import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EMPTY_FORM = {
  title: "", description: "", deadline: "",
  prize_details: "", rules: "", is_active: true, banner_image: null,
};

const toInputDatetime = (iso) => iso ? iso.slice(0, 16) : "";

export default function AdminContests() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  
  // Submissions state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contests"); // "contests" or "submissions"
  const [viewSubmission, setViewSubmission] = useState(null); // For viewing submission details

  const fetchItems = useCallback(async (url = "/api/contests/") => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter !== "") params.is_active = activeFilter;
      const res = await api.get(url, { params });
      const data = res.data;
      setItems(data.results ?? data);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch {
      setError(t("errors", "failedToLoadContests"));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, t]);

  useEffect(() => { fetchItems(); }, [activeFilter]);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const res = await api.get("/api/contests/submissions/");
      setSubmissions(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  // Switch tab
  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeTab, fetchSubmissions]);

  // Update submission status
  const updateSubmissionStatus = async (submissionId, newStatus) => {
    try {
      await api.patch(`/api/contests/submissions/${submissionId}/`, { status: newStatus });
      fetchSubmissions();
    } catch (err) {
      console.error("Error updating submission status:", err);
      alert(t("errors", "failedToUpdateStatus"));
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setError(""); setModal("create"); };
  const openEdit = (c) => {
    setSelected(c);
    setForm({
      title: c.title, description: c.description,
      deadline: toInputDatetime(c.deadline),
      prize_details: c.prize_details, rules: c.rules,
      is_active: c.is_active, banner_image: null,
    });
    setError("");
    setModal("edit");
  };
  const openDelete = (c) => { setSelected(c); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.deadline || !form.description) {
      setError(t("errors", "requiredFieldsContest"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "banner_image" && !v) return;
        if (v !== null && v !== undefined && v !== "") {
          fd.append(k, k === "is_active" ? String(v) : v);
        }
      });
      if (modal === "create") {
        await api.post("/api/contests/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.patch(`/api/contests/${selected.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
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

  const toggleActive = async (contest) => {
    try {
      await api.patch(`/api/contests/${contest.id}/`, { is_active: !contest.is_active });
      fetchItems();
    } catch {
      alert(t("errors", "failedToUpdateStatus"));
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/api/contests/${selected.id}/`);
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
          <h1>{t("contests", "title")}</h1>
          <p>{t("contests", "manageWritingContests")}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ {t("contests", "newContest")}</button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        <button 
          className={`admin-tab ${activeTab === "contests" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("contests")}
        >
          {t("contests", "contests") || "Contests"}
        </button>
        <button 
          className={`admin-tab ${activeTab === "submissions" ? "admin-tab-active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          {t("contests", "submissions") || "Submissions"}
        </button>
      </div>

      {activeTab === "contests" ? (
      <div className="admin-card">
        <div className="admin-table-toolbar">
          <select className="admin-select" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
            <option value="">{t("contests", "allContests")}</option>
            <option value="true">{t("contests", "activeOnly")}</option>
            <option value="false">{t("contests", "inactiveOnly")}</option>
          </select>
        </div>

        {loading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : items.length === 0 ? (
          <div className="admin-empty"><p>{t("contests", "noContestsFound")}</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("contests", "banner")}</th>
                    <th>{t("contests", "titleCol")}</th>
                    <th>{t("contests", "deadline")}</th>
                    <th>{t("common", "status")}</th>
                    <th>{t("contests", "expired")}</th>
                    <th>{t("contests", "created")}</th>
                    <th>{t("common", "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.banner_image ? (
                          <img src={`${API_BASE}${c.banner_image}`} alt={c.title} className="admin-table-img" />
                        ) : (
                          <div style={{ width: 48, height: 48, background: "#f0f2f5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏆</div>
                        )}
                      </td>
                      <td>
                        <strong style={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.title}
                        </strong>
                      </td>
                      <td>{new Date(c.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>
                        <label className="admin-toggle">
                          <input type="checkbox" checked={c.is_active} onChange={() => toggleActive(c)} />
                          <span style={{ fontSize: 12, color: c.is_active ? "var(--admin-success)" : "var(--admin-text-light)" }}>
                            {c.is_active ? t("common", "active") : t("common", "inactive")}
                          </span>
                        </label>
                      </td>
                      <td>
                        <span className={`admin-badge ${c.is_expired ? "admin-badge-danger" : "admin-badge-success"}`}>
                          {c.is_expired ? t("contests", "expired") : t("contests", "open")}
                        </span>
                      </td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(c)}>{t("common", "edit")}</button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => openDelete(c)}>{t("common", "delete")}</button>
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
      ) : (
      <div className="admin-card">
        {submissionsLoading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : submissions.length === 0 ? (
          <div className="admin-empty"><p>{t("contests", "noSubmissionsFound") || "No submissions found"}</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("contests", "participantName") || "Name"}</th>
                    <th>{t("contests", "participantEmail") || "Email"}</th>
                    <th>{t("contests", "participantContact") || "Contact"}</th>
                    <th>{t("contests", "contest") || "Contest"}</th>
                    <th>{t("contests", "contentType") || "Type"}</th>
                    <th>{t("contests", "entryTitle") || "Title"}</th>
                    <th>{t("common", "status")}</th>
                    <th>{t("contests", "submittedOn") || "Submitted"}</th>
                    <th>{t("common", "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.participant_name || s.user_name || "-"}</td>
                      <td>{s.participant_email || "-"}</td>
                      <td>{s.participant_contact || "-"}</td>
                      <td>{s.contest_title || "-"}</td>
                      <td>
                        <span className="admin-badge admin-badge-info">
                          {s.content_type}
                        </span>
                      </td>
                      <td>
                        <strong style={{ display: "block", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.title}
                        </strong>
                      </td>
                      <td>
                        <select 
                          className="admin-select" 
                          value={s.status}
                          onChange={(e) => updateSubmissionStatus(s.id, e.target.value)}
                          style={{ minWidth: 100 }}
                        >
                          <option value="pending">{t("common", "pending") || "Pending"}</option>
                          <option value="approved">{t("common", "approved") || "Approved"}</option>
                          <option value="rejected">{t("common", "rejected") || "Rejected"}</option>
                        </select>
                      </td>
                      <td>{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
                      <td>
                        <button 
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => {
                            setViewSubmission(s);
                          }}
                        >
                          {t("common", "view") || "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      )}

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "create" ? t("contests", "newContestTitle") : t("contests", "editContestTitle")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="admin-form-grid">
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("contests", "titleLabel")}</label>
                    <input className="admin-form-input" name="title" value={form.title} onChange={handleChange} placeholder={t("contests", "titlePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("contests", "deadlineLabel")}</label>
                    <input className="admin-form-input" type="datetime-local" name="deadline" value={form.deadline} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("contests", "statusLabel")}</label>
                    <label className="admin-toggle" style={{ marginTop: 8 }}>
                      <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
                      <span>{t("contests", "activeStatus")}</span>
                    </label>
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("contests", "descriptionLabel")}</label>
                    <textarea className="admin-form-textarea" name="description" value={form.description} onChange={handleChange} placeholder={t("contests", "descriptionPlaceholder")} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("contests", "prizeDetailsLabel")}</label>
                    <textarea className="admin-form-textarea" name="prize_details" value={form.prize_details} onChange={handleChange} placeholder={t("contests", "prizeDetailsPlaceholder")} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("contests", "rulesLabel")}</label>
                    <textarea className="admin-form-textarea" name="rules" value={form.rules} onChange={handleChange} placeholder={t("contests", "rulesPlaceholder")} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("contests", "bannerImageLabel")}</label>
                    <input className="admin-form-input" type="file" name="banner_image" accept="image/*" onChange={handleChange} />
                    {selected?.banner_image && !form.banner_image && (
                      <img src={`${API_BASE}${selected.banner_image}`} alt="" className="admin-img-preview" style={{ marginTop: 8 }} />
                    )}
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>{t("common", "cancel")}</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? t("common", "saving") : modal === "create" ? t("contests", "createContest") : t("contests", "saveChangesContest")}
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
              <h3>{t("contests", "deleteContest")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p>{t("contests", "deleteConfirm", { title: selected?.title })}</p>
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

      {/* View Submission Modal */}
      {viewSubmission && (
        <div className="admin-modal-overlay" onClick={() => setViewSubmission(null)}>
          <div className="admin-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{t("contests", "submissionDetails") || "Submission Details"}</h3>
              <button className="admin-modal-close" onClick={() => setViewSubmission(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label className="admin-form-label">Contest</label>
                <p>{viewSubmission.contest_title}</p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Participant Name</label>
                <p>{viewSubmission.participant_name}</p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Email</label>
                <p>{viewSubmission.participant_email}</p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Contact</label>
                <p>{viewSubmission.participant_contact}</p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <p>{viewSubmission.title}</p>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Content</label>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  padding: '12px', 
                  background: '#f5f5f5', 
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {viewSubmission.content}
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select 
                  className="admin-form-input"
                  value={viewSubmission.status}
                  onChange={async (e) => {
                    await updateSubmissionStatus(viewSubmission.id, e.target.value);
                    setViewSubmission({ ...viewSubmission, status: e.target.value });
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setViewSubmission(null)}>
                {t("common", "close") || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
