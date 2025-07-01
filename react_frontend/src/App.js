import React, { useState, useEffect } from 'react';
import './App.css';

// Configuration: Backend URL (adjust if frontend and backend run on different origins)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// PUBLIC_INTERFACE
/**
 * BookQuery AI Main App Layout and Functionality.
 * - Header: Navigation and app title.
 * - Sidebar: Uploaded books list.
 * - Main area: PDF upload & Q&A interface, answer/status display.
 * - REST API connectivity for PDF upload, book listing, question/answer.
 */
function App() {
  // Theme, books, UI state
  const [theme, setTheme] = useState('light');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [qaStatus, setQaStatus] = useState('');
  const [appStatus, setAppStatus] = useState('');

  // Effect: Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Effect: Load list of books at mount/after upload
  useEffect(() => {
    fetchBooks();
    // Optionally: poll the '/status' endpoint for overall backend/app status
    fetchStatus();
  }, []);

  // PUBLIC_INTERFACE
  // Toggle theme (light/dark)
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fetch books from backend
  const fetchBooks = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/books`);
      if (!resp.ok) throw new Error('Failed to fetch books');
      const data = await resp.json();
      setBooks(data.books || []);
      // If needed, restore selection if previously uploaded
      if (!selectedBookId && data.books.length > 0) {
        setSelectedBookId(data.books[0].id);
        setSelectedBookTitle(data.books[0].title);
      }
    } catch (err) {
      setBooks([]);
      setAppStatus('Error fetching books.');
    }
  };

  // Fetch app/backend status (optional, e.g., show warnings)
  const fetchStatus = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/status`);
      if (resp.ok) {
        const data = await resp.json();
        setAppStatus(data.message || '');
      }
    } catch {
      setAppStatus('Backend not reachable');
    }
  };

  // Handle PDF file selection
  const handlePdfChange = (e) => {
    setPdfFile(e.target.files?.[0] || null);
  };

  // Handle PDF upload to backend
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;
    setUploading(true);
    setUploadStatus('');
    setQaStatus('');
    setAnswer('');
    const formData = new FormData();
    formData.append('file', pdfFile);

    try {
      const resp = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!resp.ok) {
        throw new Error(`Upload failed (${resp.status})`);
      }
      const data = await resp.json();
      setUploadStatus('Upload successful!');
      setQuestion('');
      setPdfFile(null);
      // Refresh book list
      await fetchBooks();
      // Auto-select uploaded book if possible
      if (data && data.book && data.book.id) {
        setSelectedBookId(data.book.id);
        setSelectedBookTitle(data.book.title || pdfFile.name);
      }
    } catch (err) {
      setUploadStatus('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Handle book selection (sidebar)
  const handleBookSelect = (book) => {
    setSelectedBookId(book.id);
    setSelectedBookTitle(book.title);
    setAnswer('');
    setQuestion('');
    setQaStatus('');
  };

  // Handle user's question submission
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedBookId) return;
    setAsking(true);
    setQaStatus('Getting answer...');
    setAnswer('');

    try {
      const resp = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: selectedBookId,
          question: question,
        }),
      });
      if (!resp.ok) throw new Error('Failed to get answer.');
      const data = await resp.json();
      setAnswer(data.answer || 'No answer returned.');
      setQaStatus('');
    } catch (err) {
      setQaStatus('Error getting answer.');
    } finally {
      setAsking(false);
    }
  };

  // Visual palette from requirements and README (primary, secondary, accent)
  const themeColors = {
    primary: '#1a73e8',
    secondary: '#185abc',
    accent: '#fbbc04',
    // For light theme defaults
    headerBg: 'var(--bg-secondary)',
    sidebarBg: '#f5f8fd',
    mainBg: 'var(--bg-primary)',
    border: '#eaeaea'
  };

  // --- UI Components ---
  return (
    <div className="app-root" style={{ minHeight: "100vh", background: themeColors.mainBg, color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{
        background: themeColors.primary,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        height: "64px",
        padding: "0 1.5rem",
        justifyContent: "space-between",
        borderBottom: `2px solid ${themeColors.secondary}`,
        position: "sticky",
        top: 0,
        zIndex: 1001
      }}>
        <div className="header-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" style={{ marginRight: "0.5rem" }}>
            <circle cx="16" cy="16" r="16" fill={themeColors.accent} />
            <text x="16" y="20" textAnchor="middle" fontWeight="bold" fontSize="16" fill={themeColors.primary}>AI</text>
          </svg>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 600, letterSpacing: 1 }}>BookQuery <span style={{ fontWeight: 400, color: themeColors.accent }}>AI</span></h1>
        </div>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <a href="https://github.com/" style={{ color: "#fff", textDecoration: "underline", fontWeight: 400 }} target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      {/* Main layout: Sidebar + Main Panel */}
      <div style={{ display: "flex", flexDirection: "row", height: "calc(100vh - 64px)" }}>
        {/* Sidebar: Book List */}
        <aside className="sidebar" style={{
          background: themeColors.sidebarBg,
          borderRight: `2px solid ${themeColors.border}`,
          minWidth: "220px",
          maxWidth: "260px",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          height: "100%"
        }}>
          <div>
            <h2 style={{
              margin: "0 0 1rem 0",
              fontSize: "1.1rem",
              fontWeight: 600,
              color: themeColors.primary,
              letterSpacing: ".5px"
            }}>Books</h2>
            <div style={{
              maxHeight: "60vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem"
            }}>
              {books && books.length > 0 ? (
                books.map(book => (
                  <button
                    key={book.id}
                    onClick={() => handleBookSelect(book)}
                    className={`sidebar-book-list-item${selectedBookId === book.id ? " active" : ""}`}
                    style={{
                      background: selectedBookId === book.id ? themeColors.primary : "transparent",
                      color: selectedBookId === book.id ? "#fff" : "#222",
                      border: "none",
                      padding: "7px 12px",
                      borderRadius: "4px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontWeight: selectedBookId === book.id ? 600 : 500,
                      transition: "background .2s"
                    }}
                  >
                    {(book.title||"Untitled").slice(0,40)}
                  </button>
                ))
              ) : (
                <div style={{ fontSize: ".92em", color: "#7a7a7a" }}>No books yet.<br />Please upload a PDF.</div>
              )}
            </div>
          </div>
          <div style={{ flexGrow: 1 }} />
        </aside>
        {/* Main Panel: PDF Upload & Q&A */}
        <main
          className="main-panel"
          style={{
            flex: 1,
            minWidth: 0,
            background: themeColors.mainBg,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "start",
            padding: "2rem 2vw",
            gap: "2rem",
            height: "100%",
            position: "relative"
          }}
        >
          {/* Status bar */}
          <div style={{
            position: "absolute",
            top: 12,
            right: 24,
            fontSize: ".92rem",
            letterSpacing: "0.2px",
            color: themeColors.secondary,
            zIndex: 2
          }}>
            {appStatus}
          </div>
          {/* PDF Upload Form */}
          <section
            className="pdf-upload-section"
            style={{
              margin: "0 0 2rem 0",
              background: "#fff",
              borderRadius: "10px",
              boxShadow: "0 1px 8px rgba(30,30,70,0.08)",
              padding: "1.2rem 2rem 1.2rem 2rem",
              border: `1.5px solid ${themeColors.border}`,
              maxWidth: 540
            }}
          >
            <h2 style={{ color: themeColors.secondary, fontWeight: 600, marginBottom: "0.2em" }}>Upload a PDF Book</h2>
            <form onSubmit={handleUpload}
              style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept="application/pdf"
                required
                disabled={uploading}
                onChange={handlePdfChange}
                style={{ flex: 1, margin: "0.5em 0" }}
              />
              <button
                type="submit"
                className="btn"
                disabled={uploading || !pdfFile}
                style={{
                  background: themeColors.accent,
                  color: "#fff",
                  padding: "0.5em 1.2em",
                  borderRadius: "5px",
                  border: "none",
                  fontWeight: 600,
                  cursor: uploading ? "wait" : "pointer",
                  transition: "background .2s"
                }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
            {uploadStatus &&
              <div style={{ marginTop: "0.5em", color: uploadStatus.includes("success") ? themeColors.primary : "#b22f2f", fontWeight: "500" }}>
                {uploadStatus}
              </div>
            }
          </section>

          {/* Q&A Section */}
          <section
            className="qa-section"
            style={{
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 1px 12px rgba(20,40,80,0.10)",
              padding: "2rem 2.5rem",
              border: `1.5px solid ${themeColors.border}`,
              maxWidth: "800px",
              margin: "0 auto"
            }}
          >
            <h2 style={{ margin: 0, color: themeColors.primary, fontWeight: 600, fontSize: "1.25rem" }}>
              Ask a Question
            </h2>
            <div style={{ color: "#888", fontSize: "1em", margin: "0 .1em .8em .1em" }}>
              About{' '}
              <strong style={{ color: themeColors.secondary }}>
                {selectedBookTitle || '...'}
              </strong>
              {selectedBookTitle === "" && " (Select a book)"}
            </div>
            <form
              onSubmit={handleAsk}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "1rem" }}
            >
              <input
                type="text"
                value={question}
                placeholder="e.g. What is the main idea of chapter 2?"
                disabled={!selectedBookId || asking}
                onChange={e => setQuestion(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.6em 1em",
                  fontSize: "1.1em",
                  borderRadius: "6px",
                  border: `1.5px solid ${themeColors.primary}55`,
                  outline: "none"
                }}
                maxLength={512}
              />
              <button
                type="submit"
                className="btn"
                disabled={!selectedBookId || !question.trim() || asking}
                style={{
                  background: themeColors.primary,
                  color: "#fff",
                  padding: "0.6em 1.5em",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 600,
                  opacity: (!selectedBookId || !question.trim() || asking) ? 0.6 : 1,
                  cursor: (!selectedBookId || !question.trim() || asking) ? "not-allowed" : "pointer"
                }}
              >
                {asking ? "Thinking..." : "Ask"}
              </button>
            </form>
            {qaStatus &&
              <div style={{ color: themeColors.secondary, marginTop: "0.6em", fontWeight: 500 }}>{qaStatus}</div>
            }
            {answer &&
              <div style={{
                marginTop: "1.7em",
                borderTop: `1px dotted ${themeColors.border}`,
                padding: "1.2em 0 0 0",
                color: "#23223a",
                fontSize: "1.07em",
                lineHeight: 1.6
              }}>
                <strong style={{ color: themeColors.accent }}>Answer:</strong> <span>{answer}</span>
              </div>
            }
          </section>
        </main>
      </div>
      {/* Footer */}
      <footer style={{
        height: 36,
        fontSize: ".97em",
        background: themeColors.secondary,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        letterSpacing: "0.5px",
        marginTop: 0
      }}>
        Made with <span aria-label="love" style={{ margin: "0 .35em", color: themeColors.accent }}>&#10084;&#65039;</span> BookQuery AI
      </footer>
    </div>
  );
}

export default App;
