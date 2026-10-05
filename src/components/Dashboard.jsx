import React, { useState } from "react";
import "./Dashboard.css";

function Dashboard() {
  const userName = localStorage.getItem("userName") || "Student";

  // Read documents saved from your Upload page
  const [recentFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentDocuments")) || [];
    } catch {
      return [];
    }
  });

  // Navigate using the existing hash-based routing
  const navigateTo = (path) => {
    window.location.hash = path;
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    navigateTo("home");
  };

  // Dynamic statistics
  const totalDocuments = recentFiles.length;

  // Count saved/bookmarked documents
  const savedBookmarks = recentFiles.filter(
    (file) => file.bookmarked === true || file.isBookmarked === true
  ).length;

  // Total document storage
  const totalStorage = recentFiles.reduce(
    (sum, file) => sum + (Number(file.size) || 0),
    0
  );

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";

    const mb = bytes / (1024 * 1024);

    if (mb < 0.01) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${mb.toFixed(1)} MB`;
  };

  // Format upload date
  const formatDate = (date) => {
    if (!date) return "Uploaded today";

    const uploadDate = new Date(date);

    if (Number.isNaN(uploadDate.getTime())) {
      return "Uploaded today";
    }

    const now = new Date();

    const diff = Math.floor(
      (now - uploadDate) / (1000 * 60 * 60 * 24)
    );

    if (diff <= 0) return "Uploaded today";
    if (diff === 1) return "Uploaded yesterday";

    return `Uploaded ${diff} days ago`;
  };

  // File icon based on extension
  const getFileIcon = (fileName = "") => {
    const ext = fileName.split(".").pop().toLowerCase();

    if (ext === "pdf") return "▤";
    if (ext === "doc" || ext === "docx") return "▥";
    if (ext === "ppt" || ext === "pptx") return "▧";

    return "▧";
  };

  // Open the first document for AI-related actions
  const openFirstDocument = () => {
    if (recentFiles.length > 0) {
      navigateTo(`reader/${recentFiles[0].id}`);
    } else {
      navigateTo("upload");
    }
  };

  return (
    <div className="dashboard-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="dashboard-sidebar">

        <a href="#dashboard" className="dashboard-logo">
          <span className="dashboard-logo-icon">✦</span>
          <span>DocIQ</span>
        </a>

        <div className="dashboard-menu-title">
          MAIN MENU
        </div>

        <nav className="dashboard-menu">

          {/* Dashboard */}
          <a
            href="#dashboard"
            className="dashboard-menu-item active"
          >
            <span>🏠</span>
            Dashboard
          </a>

          {/* Documents */}
         <a href="#documents" className="dashboard-menu-item">
              <span>📄</span>
              My Documents
        </a>

          {/* Upload */}
          <a
            href="#upload"
            className="dashboard-menu-item"
          >
            <span>📤</span>
            Upload Document
          </a>

          {/* NEW: Study Hub */}
          <a
            href="#study"
            className="dashboard-menu-item"
          >
            <span>🎓</span>
            Study Hub
          </a>

          {/* AI Assistant */}
          <a
            href="#assistant"
            className="dashboard-menu-item"
          >
            <span>🤖</span>
            AI Assistant
          </a>

          {/* Settings */}
          <a
            href="#settings"
            className="dashboard-menu-item"
          >
            <span>⚙️</span>
            Settings
          </a>

        </nav>

        {/* ================= SIDEBAR BOTTOM ================= */}

        <div className="dashboard-sidebar-bottom">

          <div className="dashboard-help-card">

            <div className="dashboard-help-icon">
              ?
            </div>

            <strong>
              Need help?
            </strong>

            <p>
              Explore DocIQ and learn smarter.
            </p>

            <button
              type="button"
              onClick={() => navigateTo("upload")}
            >
              Learn more →
            </button>

          </div>

          <button
            className="dashboard-logout"
            onClick={handleLogout}
            type="button"
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN AREA ================= */}

      <main className="dashboard-main">

        {/* ================= TOPBAR ================= */}

        <header className="dashboard-topbar">

          <div className="dashboard-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search your documents..."
            />

          </div>

          <div className="dashboard-profile">

            <div className="dashboard-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="dashboard-profile-info">

              <strong>
                Hello, {userName} 👋
              </strong>

              <span>
                Welcome back
              </span>

            </div>

          </div>

        </header>

        {/* ================= WELCOME SECTION ================= */}

        <section className="dashboard-welcome-section">

          <div>

            <p className="dashboard-small-label">
              YOUR PERSONAL AI ASSISTANT
            </p>

            <h1>
              Welcome back, {userName}!
            </h1>

            <p>
              Turn your documents into knowledge with DocIQ.
            </p>

          </div>

          <div className="dashboard-welcome-symbol">
            ✦
          </div>

        </section>

        {/* ================= STATISTICS ================= */}

        <section className="dashboard-statistics">

          {/* Total Documents */}

          <div className="dashboard-stat-card purple-stat">

            <div className="dashboard-stat-icon">
              ▤
            </div>

            <div>

              <span>
                Total Documents
              </span>

              <h2>
                {totalDocuments}
              </h2>

              <p>
                Documents uploaded
              </p>

            </div>

          </div>

          {/* AI Summaries */}

          <div className="dashboard-stat-card blue-stat">

            <div className="dashboard-stat-icon">
              ✦
            </div>

            <div>

              <span>
                AI Summaries
              </span>

              <h2>
                0
              </h2>

              <p>
                Summaries generated
              </p>

            </div>

          </div>

          {/* NEW: Saved Bookmarks */}

          <div className="dashboard-stat-card green-stat">

            <div className="dashboard-stat-icon">
              🔖
            </div>

            <div>

              <span>
                Saved Bookmarks
              </span>

              <h2>
                {savedBookmarks}
              </h2>

              <p>
                Important sections saved
              </p>

            </div>

          </div>

          {/* Storage */}

          <div className="dashboard-stat-card orange-stat">

            <div className="dashboard-stat-icon">
              ◉
            </div>

            <div>

              <span>
                Storage Used
              </span>

              <h2>
                {formatFileSize(totalStorage)}
              </h2>

              <p>
                Of your available storage
              </p>

            </div>

          </div>

        </section>

        {/* ================= MAIN GRID ================= */}

        <section className="dashboard-content-grid">

          {/* ================= RECENT DOCUMENTS ================= */}

          <div className="dashboard-panel recent-documents-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Recent Documents
                </h2>

                <p>
                  Your recently uploaded files
                </p>

              </div>

              <button
                type="button"
                onClick={() => navigateTo("documents")}
              >
                View all →
              </button>

            </div>

            {recentFiles.length === 0 ? (

              /* Empty State */

              <div className="dashboard-empty-state">

                <div className="dashboard-empty-icon">
                  ▤
                </div>

                <h3>
                  No documents yet
                </h3>

                <p>
                  Upload your first document to start exploring
                  the features of DocIQ.
                </p>

                <button
                  className="dashboard-primary-button"
                  type="button"
                  onClick={() => navigateTo("upload")}
                >
                  ↑ Upload your first document
                </button>

              </div>

            ) : (

              /* Recent Documents List */

              <div
                className="dashboard-recent-list"
                style={{
                  marginTop: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >

                {recentFiles.map((file) => (

                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #f1f5f9",
                      background: "#ffffff"
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >

                      {/* File Icon */}

                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          background: "#f0f4ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px"
                        }}
                      >
                        {getFileIcon(file.name)}
                      </div>

                      {/* File Information */}

                      <div>

                        <strong
                          style={{
                            display: "block",
                            fontSize: "14px",
                            color: "#1e293b"
                          }}
                        >
                          {file.name}
                        </strong>

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b"
                          }}
                        >
                          {file.type || "FILE"} •{" "}
                          {formatFileSize(file.size)} •{" "}
                          {formatDate(file.date)}
                        </span>

                      </div>

                    </div>

                    {/* Bookmark + View */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >

                      {(file.bookmarked === true ||
                        file.isBookmarked === true) && (
                        <span
                          title="Bookmarked"
                          style={{
                            fontSize: "16px"
                          }}
                        >
                          🔖
                        </span>
                      )}

                      <button
                        type="button"
                        style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "13px"
                        }}
                        onClick={() => {
                          navigateTo(`reader/${file.id}`);
                        }}
                      >
                        View
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* ================= QUICK ACTIONS ================= */}

          <div className="dashboard-panel quick-actions-panel">

            <div className="dashboard-panel-heading">

              <div>

                <h2>
                  Quick Actions
                </h2>

                <p>
                  Start learning faster
                </p>

              </div>

            </div>

            <div className="dashboard-quick-actions">

              {/* Upload */}

              <button
                className="quick-action-item"
                type="button"
                onClick={() => navigateTo("upload")}
              >

                <span className="quick-action-icon upload-action">
                  ↑
                </span>

                <span>

                  <strong>
                    Upload Document
                  </strong>

                  <small>
                    Add a new file
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

              {/* AI Summarization */}

              <button
                className="quick-action-item"
                type="button"
                onClick={openFirstDocument}
              >

                <span className="quick-action-icon summary-action">
                  ✦
                </span>

                <span>

                  <strong>
                    AI Summarization
                  </strong>

                  <small>
                    Understand documents quickly
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

              {/* Ask AI */}

              <button
                className="quick-action-item"
                type="button"
                onClick={openFirstDocument}
              >

                <span className="quick-action-icon question-action">
                  ?
                </span>

                <span>

                  <strong>
                    Ask AI Assistant
                  </strong>

                  <small>
                    Ask questions from documents
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

              {/* Translate */}

              <button
                className="quick-action-item"
                type="button"
                onClick={openFirstDocument}
              >

                <span className="quick-action-icon translate-action">
                  文
                </span>

                <span>

                  <strong>
                    Translate Text
                  </strong>

                  <small>
                    Read content in your language
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

              {/* NEW: Interactive Study Mode */}

              <button
                className="quick-action-item"
                type="button"
                onClick={() => navigateTo("study")}
              >

                <span className="quick-action-icon study-action">
                  ✓
                </span>

                <span>

                  <strong>
                    Interactive Study Mode
                  </strong>

                  <small>
                    MCQs, flashcards & practice tests
                  </small>

                </span>

                <b>
                  →
                </b>

              </button>

            </div>

          </div>

        </section>

        {/* ================= BOTTOM INFORMATION ================= */}

        <section className="dashboard-learning-banner">

          <div className="dashboard-banner-icon">
            ✦
          </div>

          <div>

            <h2>
              Learn smarter with DocIQ
            </h2>

            <p>
              Upload your notes, research papers, and study
              materials to begin your learning journey.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigateTo("upload")}
          >
            Get started →
          </button>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
