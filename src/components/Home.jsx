import React from "react";
import "./Home.css";
function Home() {
  return (
    <div className="home-page">
      {/* ================= NAVBAR ================= */}
      <nav className="home-navbar">
        <a href="#home" className="brand">
          <div className="brand-icon">
            <span>✦</span>
          </div>

          <span className="brand-name">DocIQ</span>
        </a>

        <div className="nav-links">
          <a href="#home" className="nav-active">
            Home
          </a>

          <a href="#features">Features</a>

          <a href="#how-it-works">How It Works</a>

          <a href="#about">About</a>
        </div>

        <button
          className="nav-login-button"
          onClick={() => {
            window.location.hash = "login";
          }}
        >
          Login
          <span>→</span>
        </button>
      </nav>

      {/* ================= HERO ================= */}
      <section className="hero-section" id="home">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Document Intelligence
          </div>

          <h1 className="hero-title">
            Read Smarter.
            <br />
            <span>Understand Better.</span>
          </h1>

          <p className="hero-description">
            DocIQ transforms your documents into meaningful knowledge.
            Upload your PDFs, notes and study materials and let AI
            summarize, explain and answer your questions instantly.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-hero-button"
              onClick={() => {
                window.location.hash = "login";
              }}
            >
              Get Started
              <span>→</span>
            </button>

            <a
              href="#features"
              className="secondary-hero-button"
            >
              Explore Features
              <span>↓</span>
            </a>
          </div>

          <div className="hero-users">
            <div className="user-avatars">
              <div className="avatar">A</div>
              <div className="avatar">S</div>
              <div className="avatar">R</div>
              <div className="avatar">+</div>
            </div>

            <div className="user-text">
              <strong>Learn smarter with AI</strong>
              <span>Built for students and learners</span>
            </div>
          </div>
        </div>

        {/* ================= HERO VISUAL ================= */}
        <div className="hero-right">
          <div className="hero-glow"></div>

          <div className="floating-card floating-pdf">
            <div className="file-icon pdf-icon">PDF</div>

            <div className="floating-file-info">
              <strong>Research.pdf</strong>
              <small>2.4 MB</small>
            </div>
          </div>

          <div className="ai-document-card">
            <div className="ai-card-header">
              <div className="mini-brand">
                <div className="mini-logo">✦</div>
                <span>DocIQ AI</span>
              </div>

              <div className="status">
                <span></span>
                AI Ready
              </div>
            </div>

            <div className="document-preview-card">
              <div className="document-top">
                <div className="document-file-icon">PDF</div>

                <div className="document-info">
                  <strong>Introduction to AI</strong>
                  <small>12 pages • 1.8 MB</small>
                </div>

                <div className="more-icon">⋮</div>
              </div>

              <div className="document-lines">
                <div className="line line-large"></div>
                <div className="line"></div>
                <div className="line line-medium"></div>
                <div className="line"></div>
                <div className="line line-short"></div>
                <div className="line line-highlight"></div>
              </div>
            </div>

            <div className="ai-actions-title">
              What would you like to do?
            </div>

            <div className="ai-actions">
              <div className="ai-action">
                <div className="action-icon summary-icon">✦</div>

                <div className="action-content">
                  <strong>Summarize</strong>
                  <span>Get the key points</span>
                </div>

                <span className="action-arrow">→</span>
              </div>

              <div className="ai-action">
                <div className="action-icon explain-icon">?</div>

                <div className="action-content">
                  <strong>Explain</strong>
                  <span>Understand difficult topics</span>
                </div>

                <span className="action-arrow">→</span>
              </div>

              <div className="ai-action">
                <div className="action-icon question-icon">Q</div>

                <div className="action-content">
                  <strong>Ask Questions</strong>
                  <span>Chat with your document</span>
                </div>

                <span className="action-arrow">→</span>
              </div>
            </div>
          </div>

          <div className="floating-ai-card">
            <div className="ai-avatar">✦</div>

            <div className="ai-floating-text">
              <strong>AI Assistant</strong>
              <span>Ready to help you</span>
            </div>

            <div className="online-dot"></div>
          </div>

          <div className="floating-stat-card">
            <div className="stat-icon">✓</div>

            <div className="stat-text">
              <strong>Instant Analysis</strong>
              <span>Powered by AI</span>
            </div>
          </div>

          <div className="decorative-circle circle-one"></div>
          <div className="decorative-circle circle-two"></div>
        </div>
      </section>

      {/* ================= TRUST ================= */}
      <section className="trust-section">
        <p>
          Everything you need to understand your documents better
        </p>

        <div className="trust-items">
          <div>
            <span>✦</span>
            AI Powered
          </div>

          <div>
            <span>✓</span>
            Easy to Use
          </div>

          <div>
            <span>⚡</span>
            Fast Analysis
          </div>

          <div>
            <span>🔒</span>
            Secure
          </div>

          <div>
            <span>♿</span>
            Accessible
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="features-section" id="features">
        <div className="section-heading">
          <div className="section-badge">FEATURES</div>

          <h2>
            One document.
            <br />
            <span>Many possibilities.</span>
          </h2>

          <p>
            DocIQ gives you powerful AI tools to turn complex
            documents into simple, useful knowledge.
          </p>
        </div>

        <div className="feature-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-number">01</div>

            <div className="feature-icon coral">✦</div>

            <h3>AI Summarization</h3>

            <p>
              Quickly extract the most important information
              from long documents and notes.
            </p>

            <a href="#features">Learn more →</a>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-number">02</div>

            <div className="feature-icon plum">?</div>

            <h3>Smart Explanation</h3>

            <p>
              Understand difficult concepts with simple,
              easy-to-follow explanations.
            </p>

            <a href="#features">Learn more →</a>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-number">03</div>

            <div className="feature-icon gold">Q</div>

            <h3>Document Q&A</h3>

            <p>
              Ask questions about your documents and get
              relevant answers instantly.
            </p>

            <a href="#features">Learn more →</a>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-number">04</div>

            <div className="feature-icon sage">🔊</div>

            <h3>Read Aloud</h3>

            <p>
              Listen to your documents with text-to-speech
              functionality.
            </p>

            <a href="#features">Learn more →</a>
          </div>

          {/* Feature 5 - Accessibility */}
          <div className="feature-card accessibility-feature-card">
            <div className="feature-number">05</div>

            <div className="feature-icon coral">Aa</div>

            <h3>Accessible Reading</h3>

            <p>
              Adjust text size and text color for comfortable
              reading, better readability and reduced eye strain.
            </p>

            <a href="#features">Learn more →</a>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div className="section-badge">HOW IT WORKS</div>

          <h2>
            From document
            <br />
            <span>to understanding.</span>
          </h2>

          <p>
            Getting started with DocIQ is simple.
            Just follow three easy steps.
          </p>
        </div>

        <div className="steps-container">
          <div className="step">
            <div className="step-number">01</div>

            <div className="step-icon">↑</div>

            <h3>Upload</h3>

            <p>
              Upload your PDF, notes or study material
              to DocIQ.
            </p>
          </div>

          <div className="step-line"></div>

          <div className="step">
            <div className="step-number">02</div>

            <div className="step-icon">✦</div>

            <h3>Analyze</h3>

            <p>
              Our AI reads and understands the content
              of your document.
            </p>
          </div>

          <div className="step-line"></div>

          <div className="step">
            <div className="step-number">03</div>

            <div className="step-icon">✓</div>

            <h3>Understand</h3>

            <p>
              Get summaries, explanations and answers
              in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}
      <section className="about-section" id="about">
        <div className="about-card">
          <div className="about-content">
            <div className="section-badge">ABOUT DOCIQ</div>

            <h2>
              Turn documents into
              <span> knowledge.</span>
            </h2>

            <p>
              DocIQ is designed to make learning from documents
              easier. Instead of using different tools for
              summarizing, explaining, searching, translating
              and listening, everything is brought together
              in one intelligent platform.
            </p>

            <p>
              DocIQ also supports comfortable reading through
              adjustable text size, text color and accessible
              reading options. These features help improve
              readability and reduce eye strain.
            </p>
          </div>

          <div className="about-stat">
            <div className="big-star">✦</div>

            <strong>One smart workspace</strong>

            <span>for your documents</span>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="cta-section">
        <div className="cta-content">
          <div className="cta-icon">✦</div>

          <h2>
            Ready to understand
            <br />
            your documents better?
          </h2>

          <p>
            Let DocIQ turn your documents into knowledge.
          </p>

          <button
            className="cta-button"
            onClick={() => {
              window.location.hash = "login";
            }}
          >
            Start Using DocIQ
            <span>→</span>
          </button>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              <div className="brand-icon">✦</div>

              <span className="brand-name">DocIQ</span>
            </div>

            <p>
              Your intelligent document assistant.
              <br />
              Read smarter. Understand better.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Product</h4>

              <a href="#features">Features</a>

              <a href="#how-it-works">How It Works</a>

              <a href="#home">Get Started</a>
            </div>

            <div>
              <h4>Company</h4>

              <a href="#about">About</a>

              <a href="#contact">Contact</a>

              <a href="#privacy">Privacy</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 DocIQ. All rights reserved.</span>

          <span>Built with intelligence ✦</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;