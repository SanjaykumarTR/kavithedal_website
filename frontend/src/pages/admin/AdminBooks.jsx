import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../api/axios";
import { useTranslation } from "../../context/LanguageContext";
import "../../styles/admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const EMPTY_FORM = {
  title: "", author: "", author_name: "", author_email: "", author_mobile: "", description: "", price: "", discount_percentage: "", ebook_price: "",
  category: "", published_date: "", cover_image: null, pdf_file: null,
  isbn: "", is_active: true,
};

export default function AdminBooks() {
  const { t, language } = useTranslation();
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [authorSearch, setAuthorSearch] = useState("");
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);

  const categoryOptions = [
    { value: "", label: t("books", "allCategories") },
    { value: "fiction", label: t("books", "fiction") },
    { value: "non_fiction", label: t("books", "nonFiction") },
    { value: "poetry", label: t("books", "poetry") },
    { value: "biography", label: t("books", "biography") },
    { value: "children", label: t("books", "children") },
    { value: "academic", label: t("books", "academic") },
    { value: "spiritual", label: t("books", "spiritual") },
    { value: "history", label: t("books", "history") },
    { value: "self_help", label: t("books", "selfHelp") },
    { value: "other", label: t("books", "other") },
  ];

  const fetchBooks = useCallback(async (url = "/api/books/") => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get(url, { params });
      const data = res.data;
      setBooks(data.results ?? data);
      setNextPage(data.next || null);
      setPrevPage(data.previous || null);
    } catch {
      setError(t("errors", "failedToLoadBooks"));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, t]);

  useEffect(() => {
    fetchBooks();
    api.get("/api/authors/").then((r) => setAuthors(r.data.results ?? r.data));
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setAuthorSearch(""); setError(""); setModal("create"); };
  const openEdit = (book) => {
    setSelected(book);
    setAuthorSearch(book.author?.name || "");
    setForm({
      title: book.title, author: book.author?.id || book.author, author_name: book.author?.name || "", author_email: book.author?.email || "", author_mobile: book.author?.mobile_number || "", description: book.description,
      price: book.price, discount_percentage: book.discount_percentage || "",
      ebook_price: book.ebook_price || "",
      category: book.category || "",
      published_date: book.published_date, cover_image: null, pdf_file: null,
      isbn: book.isbn || "", is_active: book.is_active ?? true,
    });
    setError("");
    setModal("edit");
  };
  const openDelete = (book) => { setSelected(book); setModal("delete"); };
  const closeModal = () => { setModal(null); setSelected(null); setError(""); };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    // Validate ISBN - only allow digits, up to 20 characters
    if (name === 'isbn') {
      const filtered = value.replace(/\D/g, '').slice(0, 20);
      setForm((p) => ({ ...p, [name]: filtered }));
      return;
    }
    
    setForm((p) => ({ ...p, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Only check required fields for new books
    if (modal === "create") {
      if (!form.title || !form.price || !form.published_date) {
        setError(t("errors", "requiredFields"));
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      let authorId = form.author;
      
      // If author starts with __new__:, create new author first
      if (form.author && form.author.startsWith('__new__:')) {
        const newAuthorName = form.author.replace('__new__:', '');
        const authorRes = await api.post("/api/authors/", {
          name: newAuthorName,
          biography: "",
          email: form.author_email || "",
          mobile_number: form.author_mobile || ""
        });
        authorId = authorRes.data.id;
        // Refresh authors list
        const authorsRes = await api.get("/api/authors/");
        setAuthors(authorsRes.data.results ?? authorsRes.data);
      }
      
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'author' && authorId) {
          fd.append(k, authorId);
        } else if ((k === 'author_email' || k === 'author_mobile' || k === 'author_name') && !authorId && v) {
          // Send author fields if no author ID is set
          fd.append(k, v);
        } else if (v !== null && v !== undefined && v !== "") {
          fd.append(k, v);
        }
      });
      if (modal === "create") {
        await api.post("/api/books/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.patch(`/api/books/${selected.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      closeModal();
      fetchBooks();
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
      await api.delete(`/api/books/${selected.id}/`);
      closeModal();
      fetchBooks();
    } catch {
      setError(t("errors", "failedToDeleteBook"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div>
          <h1>{t("books", "title")}</h1>
          <p>{t("books", "manageBookCatalogue")}</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>
          + {t("books", "addBook")}
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-toolbar">
          <input
            className="admin-search"
            placeholder={t("books", "searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchBooks()}
          />
          <select
            className="admin-select"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); }}
          >
            {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button className="admin-btn admin-btn-secondary" onClick={() => fetchBooks()}>{t("common", "filter")}</button>
        </div>

        {loading ? (
          <div className="admin-empty"><div className="admin-spinner" /></div>
        ) : books.length === 0 ? (
          <div className="admin-empty"><p>{t("books", "noBooksFound")}</p></div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("books", "cover")}</th>
                    <th>{t("books", "titleCol")}</th>
                    <th>{t("books", "author")}</th>
                    <th>{t("books", "category")}</th>
                    <th>{t("books", "price")}</th>
                    <th>Discount</th>
                    <th>{t("books", "ebookPrice")}</th>
                    <th>{t("books", "published")}</th>
                    <th>{t("common", "actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => (
                    <tr key={b.id}>
                      <td>
                        {b.cover_image ? (
                          <img src={b.cover_image} alt={b.title} className="admin-table-img" />
                        ) : (
                          <div style={{ width: 48, height: 48, background: "#f0f2f5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>
                        )}
                      </td>
                      <td><strong style={{ maxWidth: 180, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</strong></td>
                      <td>{b.author?.name}</td>
                      <td><span className="admin-badge admin-badge-default">{b.category_name}</span></td>
                      <td><strong>₹{parseFloat(b.price).toFixed(2)}</strong></td>
                      <td>{b.discount_percentage > 0 ? <span className="admin-badge admin-badge-success">{b.discount_percentage}%</span> : '-'}</td>
                      <td><strong>₹{b.ebook_price ? parseFloat(b.ebook_price).toFixed(2) : '-'}</strong></td>
                      <td>{b.published_date}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => openEdit(b)}>{t("common", "edit")}</button>
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => openDelete(b)}>{t("common", "delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <button disabled={!prevPage} onClick={() => fetchBooks(prevPage.replace(API_BASE, ""))}>← {t("common", "prev")}</button>
              <button disabled={!nextPage} onClick={() => fetchBooks(nextPage.replace(API_BASE, ""))}>{t("common", "next")} →</button>
            </div>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "create" ? t("books", "addNewBook") : t("books", "editBook")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {error && <div className="admin-alert admin-alert-error">{error}</div>}
                <div className="admin-form-grid">
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("books", "titleLabel")}</label>
                    <input className="admin-form-input" name="title" value={form.title} onChange={handleChange} placeholder={t("books", "titlePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "authorLabel")}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="admin-form-input"
                        name="author"
                        value={authorSearch}
                        onChange={(e) => {
                          setAuthorSearch(e.target.value);
                          setShowAuthorDropdown(true);
                          // If user types, set the value as a potential new author
                          const existingAuthor = authors.find(a => a.name.toLowerCase() === e.target.value.toLowerCase());
                          if (existingAuthor) {
                            setForm(p => ({ ...p, author: existingAuthor.id }));
                          } else {
                            setForm(p => ({ ...p, author: `__new__:${e.target.value}` }));
                          }
                        }}
                        onFocus={() => setShowAuthorDropdown(true)}
                        onBlur={() => setTimeout(() => setShowAuthorDropdown(false), 200)}
                        placeholder={t("books", "selectAuthor")}
                        autoComplete="off"
                      />
                      {showAuthorDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          maxHeight: 200,
                          overflowY: 'auto',
                          background: 'white',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          zIndex: 1000,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                          {authors.filter(a => 
                            a.name.toLowerCase().includes(authorSearch.toLowerCase())
                          ).length > 0 ? (
                            authors.filter(a => 
                              a.name.toLowerCase().includes(authorSearch.toLowerCase())
                            ).map(a => (
                              <div
                                key={a.id}
                                style={{
                                  padding: '10px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #f0f0f0'
                                }}
                                onMouseDown={() => {
                                  setForm(p => ({ ...p, author: a.id }));
                                  setAuthorSearch(a.name);
                                  setShowAuthorDropdown(false);
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                              >
                                {a.name}
                              </div>
                            ))
                          ) : null}
                          {authorSearch && (
                            <div
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                fontWeight: 500,
                                borderTop: '1px solid #ddd'
                              }}
                              onMouseDown={() => {
                                setForm(p => ({ ...p, author: `__new__:${authorSearch}` }));
                                setShowAuthorDropdown(false);
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#c8e6c9'}
                              onMouseLeave={(e) => e.target.style.background = '#e8f5e9'}
                            >
                              + Create new author: "{authorSearch}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Author Contact Number</label>
                    <input 
                      className="admin-form-input" 
                      type="tel" 
                      name="author_mobile" 
                      value={form.author_mobile || ''} 
                      onChange={handleChange} 
                      placeholder="+91 9876543210 (optional - creates/links author)"
                    />
                    <small style={{ color: '#666', fontSize: '11px' }}>If author with same name + phone exists, they'll be linked</small>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Author Name (for new authors)</label>
                    <input 
                      className="admin-form-input" 
                      type="text" 
                      name="author_name" 
                      value={form.author_name || ''} 
                      onChange={handleChange} 
                      placeholder="Enter author name (used with contact number)"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "categoryLabel")}</label>
                    <select className="admin-form-select" name="category" value={form.category || ""} onChange={handleChange}>
                      <option value="">-- Select Category --</option>
                      {categoryOptions.filter((c) => c.value).map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "priceLabel")}</label>
                    <input className="admin-form-input" type="number" step="0.01" name="price" value={form.price} onChange={handleChange} placeholder={t("books", "pricePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount (%)</label>
                    <input className="admin-form-input" type="number" step="0.01" min="0" max="100" name="discount_percentage" value={form.discount_percentage} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "ebookPriceLabel")}</label>
                    <input className="admin-form-input" type="number" step="0.01" name="ebook_price" value={form.ebook_price} onChange={handleChange} placeholder={t("books", "ebookPricePlaceholder")} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "publishedDateLabel")}</label>
                    <input className="admin-form-input" type="date" name="published_date" value={form.published_date} onChange={handleChange} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t("books", "isbnLabel")}</label>
                    <input 
                      className="admin-form-input" 
                      type="text" 
                      name="isbn" 
                      value={form.isbn} 
                      onChange={handleChange} 
                      placeholder={t("books", "isbnPlaceholder")}
                    />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("books", "descriptionLabel")}</label>
                    <textarea className="admin-form-textarea" name="description" value={form.description} onChange={handleChange} placeholder={t("books", "descriptionPlaceholder")} />
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">{t("books", "coverImageLabel")}</label>
                    <input className="admin-form-input" type="file" name="cover_image" accept="image/*" onChange={handleChange} />
                    {selected?.cover_image && !form.cover_image && (
                      <img src={selected.cover_image} alt="" className="admin-img-preview" style={{ marginTop: 8 }} />
                    )}
                  </div>
                  <div className="admin-form-group full">
                    <label className="admin-form-label">PDF File (eBook)</label>
                    <input className="admin-form-input" type="file" name="pdf_file" accept=".pdf" onChange={handleChange} />
                    {selected?.pdf_file && !form.pdf_file && (
                      <div style={{ marginTop: 8, color: 'var(--admin-success)' }}>
                        ✓ PDF already uploaded: {selected.pdf_file.split('/').pop()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>{t("common", "cancel")}</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
                  {submitting ? t("common", "saving") : modal === "create" ? t("books", "createBook") : t("books", "saveChanges")}
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
              <h3>{t("books", "deleteBook")}</h3>
              <button className="admin-modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 15 }}>
                {t("books", "deleteConfirm", { title: selected?.title })}
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
