import React from "react";
import "./Dashboard.css";

function Dashboard() {
  const handleLogout = () => {
    window.location.hash = "home";
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

          <a href="#dashboard" className="dashboard-menu-item active">
            <span>▦</span>
            Dashboard
          </a>

          <a href="#documents" className="dashboard-menu-item">
            <span>▤</span>
            My Documents
          </a>

          <a href="#upload" className="dashboard-menu-item">
            <span>↑</span>
            Upload Document
          </a>

          <a href="#assistant" className="dashboard-menu-item">
            <span>✦</span>
            AI Assistant
          </a>

          <a href="#settings" className="dashboard-menu-item">
            <span>⚙</span>
            Settings
          </a>

        </nav>

        <div className="dashboard-sidebar-bottom">

          <div className="dashboard-help-card">
            <div className="dashboard-help-icon">?</div>

            <strong>Need help?</strong>

            <p>
              Explore DocIQ and learn smarter.
            </p>

            <button type="button">
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

        {/* Topbar */}

        <header className="dashboard-topbar">

          <div className="dashboard-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search your documents..."
            />

          </div>

          <div className="dashboard-profile">

            <div className="dashboard-avatar">
              A
            </div>

            <div className="dashboard-profile-info">
              <strong>Hello, Student 👋</strong>
              <span>Welcome back</span>
            </div>

          </div>

        </header>

        {/* Welcome Section */}

        <section className="dashboard-welcome-section">

          <div>
            <p className="dashboard-small-label">
              YOUR PERSONAL AI ASSISTANT
            </p>

            <h1>
              Welcome back, Student!
            </h1>

            <p>
              Turn your documents into knowledge with DocIQ.
            </p>
          </div>

          <div className="dashboard-welcome-symbol">
            ✦
          </div>

        </section>

        {/* Statistics */}

        <section className="dashboard-statistics">

          <div className="dashboard-stat-card purple-stat">
            <div className="dashboard-stat-icon">▤</div>

            <div>
              <span>Total Documents</span>
              <h2>0</h2>
              <p>Documents uploaded</p>
            </div>
          </div>

          <div className="dashboard-stat-card blue-stat">
            <div className="dashboard-stat-icon">✦</div>

            <div>
              <span>AI Summaries</span>
              <h2>0</h2>
              <p>Summaries generated</p>
            </div>
          </div>

          <div className="dashboard-stat-card green-stat">
            <div className="dashboard-stat-icon">◷</div>

            <div>
              <span>This Week</span>
              <h2>0</h2>
              <p>Documents processed</p>
            </div>
          </div>

          <div className="dashboard-stat-card orange-stat">
            <div className="dashboard-stat-icon">◉</div>

            <div>
              <span>Storage Used</span>
              <h2>0 MB</h2>
              <p>Of your available storage</p>
            </div>
          </div>

        </section>

        {/* Main Grid */}

        <section className="dashboard-content-grid">

          {/* Recent Documents */}

          <div className="dashboard-panel recent-documents-panel">

            <div className="dashboard-panel-heading">

              <div>
                <h2>Recent Documents</h2>
                <p>Your recently uploaded files</p>
              </div>

              <button type="button">
                View all →
              </button>

            </div>

            <div className="dashboard-empty-state">

              <div className="dashboard-empty-icon">
                ▤
              </div>

              <h3>No documents yet</h3>

              <p>
                Upload your first document to start exploring
                the features of DocIQ.
              </p>

              <button
                className="dashboard-primary-button"
                type="button"
              >
                ↑ Upload your first document
              </button>

            </div>

          </div>

          {/* Quick Actions */}

          <div className="dashboard-panel quick-actions-panel">

            <div className="dashboard-panel-heading">

              <div>
                <h2>Quick Actions</h2>
                <p>Start learning faster</p>
              </div>

            </div>

            <div className="dashboard-quick-actions">

              <button className="quick-action-item" type="button">
                <span className="quick-action-icon upload-action">
                  ↑
                </span>

                <span>
                  <strong>Upload Document</strong>
                  <small>Add a new file</small>
                </span>

                <b>→</b>
              </button>

              <button className="quick-action-item" type="button">
                <span className="quick-action-icon summary-action">
                  ✦
                </span>

                <span>
                  <strong>AI Summarization</strong>
                  <small>Understand documents quickly</small>
                </span>

                <b>→</b>
              </button>

              <button className="quick-action-item" type="button">
                <span className="quick-action-icon question-action">
                  ?
                </span>

                <span>
                  <strong>Ask AI Assistant</strong>
                  <small>Ask questions from documents</small>
                </span>

                <b>→</b>
              </button>

              <button className="quick-action-item" type="button">
                <span className="quick-action-icon translate-action">
                  文
                </span>

                <span>
                  <strong>Translate Text</strong>
                  <small>Read content in your language</small>
                </span>

                <b>→</b>
              </button>

            </div>

          </div>

        </section>

        {/* Bottom Information */}

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

          <button type="button">
            Get started →
          </button>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;