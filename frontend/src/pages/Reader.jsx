/**
 * Secure Ebook Reader Component
 * 
 * Security Features:
 * - Only authenticated users with valid purchases can access
 * - PDF URLs are time-limited (5 minutes)
 * - Right-click disabled
 * - Print/Save shortcuts disabled
 * - Watermark on every page with user email
 * - Reading progress tracking
 * - No external iframe embedding allowed
 * - Fallback to iframe viewer if PDF.js fails
 */
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LanguageContext } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/reader.css";

// PDF.js components - lazy loaded
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set PDF.js worker to use CDN (more reliable)
pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs";

// Lazy loaded PDF viewer component
function PDFViewer({ pdfUrl, currentPage, scale, onLoadSuccess, onPageChange, numPages }) {
  return (
    <Document
      file={pdfUrl}
      onLoadSuccess={onLoadSuccess}
      loading={
        <div className="pdf-loading">
          <div className="loading-spinner"></div>
          <p>Loading PDF...</p>
        </div>
      }
      error={
        <div className="pdf-error">
          <p>Failed to load PDF</p>
        </div>
      }
    >
      <Page 
        pageNumber={currentPage}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={false}
        className="pdf-page"
      />
    </Document>
  );
}

export default function Reader() {
  const { id } = useParams();
  const { language } = LanguageContext || { language: 'en' };
  const { user } = useAuth || { user: null };
  const navigate = useNavigate();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [useFallbackViewer, setUseFallbackViewer] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Get user email for watermark
  const userEmail = user?.email || user?.email_address || "reader@kavithedal.com";
  
  // Translation strings
  const translations = {
    en: {
      loading: "Loading your book...",
      loadingProgress: "Loading",
      error: "Unable to load book",
      notPurchased: "You have not purchased this book",
      backToLibrary: "Back to Library",
      page: "Page",
      of: "of",
      accessDenied: "Access Denied",
      purchaseToRead: "Please purchase this book to read it",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit Fullscreen",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      previousPage: "Previous Page",
      nextPage: "Next Page",
      protectedContent: "Protected Content",
      watermark: "watermark",
      useFallback: "Use simple viewer",
      useAdvanced: "Use advanced viewer"
    },
    ta: {
      loading: "உங்கள் புத்தகத்தை ஏற்றுகிறது...",
      loadingProgress: "ஏற்றுகிறது",
      error: "புத்தகத்தை ஏற்ற முடியவில்லை",
      notPurchased: "இந்த புத்தகத்தை வாங்கவில்லை",
      backToLibrary: "லைப்ரரிக்கு திரும்பு",
      page: "பக்கம்",
      of: "இல்",
      accessDenied: "அணுகல் மறுக்கப்பட்டது",
      purchaseToRead: "இந்த புத்தகத்தைப் படிப்பதற்கு வாங்கவும்",
      zoomIn: "பெரிதாக்கு",
      zoomOut: "சிறிதாக்கு",
      fullscreen: "முழு திரை",
      exitFullscreen: "முழு திரையை விடு",
      darkMode: "இருட்டு பயன்முறை",
      lightMode: "வெளிச்ச பயன்முறை",
      previousPage: "முன் பக்கம்",
      nextPage: "அடுத்த பக்கம்",
      protectedContent: "பாதுகாக்கப்படும் உள்ளடக்கம்",
      watermark: "முத்திரை",
      useFallback: "எளிய காட்சி",
      useAdvanced: "மேம்பட்ட காட்சி"
    }
  };
  
  const t = translations[language] || translations.en;

  // Security: Prevent various keyboard shortcuts and right-click
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && e.key === 'I') { e.preventDefault(); return false; }
      if (e.key === 'F12') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); return false; }
      if (e.key === 'PrintScreen') { e.preventDefault(); return false; }
    };
    
    const handleBeforeUnload = () => {
      try {
        if (window.self !== window.top) {
          window.top.location = window.self.location;
        }
      } catch (e) { /* cross-origin restriction */ }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('beforeunload', handleBeforeUnload);
    
    try {
      if (window.self !== window.top) {
        document.body.style.display = 'none';
        window.top.location = window.self.location;
      }
    } catch (e) { /* cross-origin restriction */ }
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isFullscreen) return;
        setShowControls(false);
      }, 3000);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
    }
  }, [isFullscreen]);

  // Fetch book and verify access
  useEffect(() => {
    fetchBookAndAccess();
  }, [id, user]);

  // Save reading progress periodically
  useEffect(() => {
    if (numPages && currentPage > 0 && book) {
      const saveProgress = async () => {
        try {
          await api.post(`/api/books/${id}/reading-progress/update/`, {
            page: currentPage,
            total_pages: numPages,
            metadata: { scale, last_position: Date.now() }
          });
        } catch (err) {
          console.error("Failed to save reading progress:", err);
        }
      };
      const timeoutId = setTimeout(saveProgress, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentPage, numPages, scale, book, id]);

  const fetchBookAndAccess = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    try {
      const accessResponse = await api.get(`/api/books/${id}/check-access/`);
      
      if (!accessResponse.data.has_access) {
        setError(t.purchaseToRead);
        setLoading(false);
        return;
      }
      
      if (accessResponse.data.current_page) {
        setCurrentPage(accessResponse.data.current_page);
      }
      
      const bookResponse = await api.get(`/api/books/${id}/`);
      const bookData = bookResponse.data;
      
      if (!bookData.pdf_file) {
        setError("No PDF file available for this book");
        setLoading(false);
        return;
      }
      
      setBook(bookData);
      
      try {
        const pdfResponse = await api.get(`/api/books/${id}/pdf/`);
        const url = pdfResponse.data.pdf_url;
        if (!url) {
          setError("PDF URL not available for this book");
          setLoading(false);
          return;
        }
        setPdfUrl(url);
      } catch (pdfError) {
        console.error("Failed to get PDF URL:", pdfError);
        setError(pdfError.response?.data?.error || "Failed to load PDF. Please try again.");
      }
      
    } catch (err) {
      console.error("Error loading book:", err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        setError(t.purchaseToRead);
      } else {
        setError(t.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages: pages }) => {
    setNumPages(pages);
    setLoadingProgress(100);
  };

  const onDocumentLoadProgress = ({ loaded, total }) => {
    if (total > 0) setLoadingProgress(Math.round((loaded / total) * 100));
  };

  const changePage = useCallback((offset) => {
    setCurrentPage(prev => Math.max(1, Math.min(prev + offset, numPages || 1)));
  }, [numPages]);

  const changeScale = useCallback((newScale) => {
    setScale(Math.max(0.5, Math.min(2.5, newScale)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const toggleViewer = useCallback(() => {
    setUseFallbackViewer(prev => !prev);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyNavigation = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changePage(1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') changePage(-1);
      else if (e.key === '+' || e.key === '=') changeScale(scale + 0.1);
      else if (e.key === '-') changeScale(scale - 0.1);
    };
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [changePage, changeScale, scale]);

  if (loading) {
    return (
      <div className={`reader-loading ${darkMode ? 'dark' : ''}`}>
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
        {loadingProgress > 0 && loadingProgress < 100 && (
          <div className="loading-progress">
            <div className="loading-progress-bar" style={{ width: `${loadingProgress}%` }}></div>
          </div>
        )}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`reader-error ${darkMode ? 'dark' : ''}`}>
        <div className="error-icon">🔒</div>
        <h2>{t.accessDenied}</h2>
        <p>{error}</p>
        <Link to="/library" className="btn-back">{t.backToLibrary}</Link>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`reader-page ${darkMode ? 'dark' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header Controls */}
      <div className={`reader-header ${showControls ? 'visible' : 'hidden'}`}>
        <Link to="/library" className="btn-back">← {t.backToLibrary}</Link>
        <h1 className="reader-title">{book?.title}</h1>
        <div className="reader-controls">
          <button onClick={toggleDarkMode} className="control-btn" title={darkMode ? t.lightMode : t.darkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={toggleFullscreen} className="control-btn" title={isFullscreen ? t.exitFullscreen : t.fullscreen}>
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </div>
      
      {/* PDF Viewer Container */}
      <div className="reader-container">
        {pdfUrl && (
          <div className="pdf-wrapper">
            {/* View toggle for fallback */}
            <div className="reader-pdf-actions">
              <button onClick={toggleViewer} className="btn-toggle-viewer">
                {useFallbackViewer ? t.useAdvanced : t.useFallback}
              </button>
            </div>

            {useFallbackViewer ? (
              // Fallback: iframe viewer (simpler, less secure)
              <div className="pdf-viewer-fallback">
                <iframe
                  src={pdfUrl}
                  className="pdf-viewer"
                  title={book?.title}
                  onError={() => setError("Failed to load PDF in viewer")}
                />
              </div>
            ) : (
              // Primary: react-pdf viewer
              <Suspense fallback={<div className="pdf-loading"><div className="loading-spinner"></div><p>Loading viewer...</p></div>}>
                <PDFViewer
                  pdfUrl={pdfUrl}
                  currentPage={currentPage}
                  scale={scale}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onPageChange={setCurrentPage}
                  numPages={numPages}
                />
              </Suspense>
            )}
            
            {/* Watermark Overlay */}
            <div className="watermark-overlay">
              <div className="watermark" style={{ opacity: 0.15 }}>
                {userEmail} • {t.watermark}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Controls */}
      <div className={`reader-footer ${showControls ? 'visible' : 'hidden'}`}>
        <div className="page-navigation">
          <button onClick={() => changePage(-1)} disabled={currentPage <= 1} className="nav-btn" title={t.previousPage}>←</button>
          <span className="page-info">{t.page} {currentPage} {t.of} {numPages || '?'}</span>
          <button onClick={() => changePage(1)} disabled={currentPage >= (numPages || 1)} className="nav-btn" title={t.nextPage}>→</button>
        </div>
        
        <div className="zoom-controls">
          <button onClick={() => changeScale(scale - 0.1)} className="zoom-btn" title={t.zoomOut}>−</button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button onClick={() => changeScale(scale + 0.1)} className="zoom-btn" title={t.zoomIn}>+</button>
        </div>
        
        <div className="reader-protection">🔒 {t.protectedContent}</div>
      </div>
    </div>
  );
}
