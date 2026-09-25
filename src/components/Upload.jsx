import React, { useRef, useState } from "react";
import "./Upload.css";

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [recentFiles, setRecentFiles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recentDocuments")) || [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef(null);

  const userName = localStorage.getItem("userName") || "Student";

  const saveRecentFiles = (files) => {
    setRecentFiles(files);
    localStorage.setItem("recentDocuments", JSON.stringify(files));
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    window.location.hash = "home";
  };

  const handleFile = (file) => {
    if (!file) return;

    const allowedExtensions = [".pdf", ".doc", ".docx", ".txt"];
    const fileName = file.name.toLowerCase();

    const validFile = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!validFile) {
      setSelectedFile(null);
      setMessage("Please upload a PDF, DOC, DOCX, or TXT file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setMessage("File size must be less than 10 MB.");
      return;
    }

    setSelectedFile(file);
    setMessage("");
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    if (extension === "pdf") return "PDF";
    if (extension === "doc") return "DOC";
    if (extension === "docx") return "DOCX";
    if (extension === "txt") return "TXT";

    return "FILE";
  };

  const getFileIcon = (fileName) => {
    const type = getFileType(fileName);

    if (type === "PDF") return "▤";
    if (type === "DOC" || type === "DOCX") return "▥";
    return "▧";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 MB";

    const mb = bytes / (1024 * 1024);

    if (mb < 0.01) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date) => {
    const uploadDate = new Date(date);
    const now = new Date();

    const difference =
      Math.floor((now - uploadDate) / (1000 * 60 * 60 * 24));

    if (difference === 0) return "Uploaded today";
    if (difference === 1) return "Uploaded yesterday";

    return `Uploaded ${difference} days ago`;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a document first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      // Save using the real MongoDB documentId returned from backend
      const newDocument = {
        id: data.documentId,
        name: selectedFile.name,
        size: selectedFile.size,
        type: getFileType(selectedFile.name),
        date: new Date().toISOString(),
      };

      const updatedFiles = [
        newDocument,
        ...recentFiles,
      ].slice(0, 5);

      saveRecentFiles(updatedFiles);

      setMessage("Document uploaded successfully!");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Automatically route to the processing animation screen (Screen 6)
      window.location.hash = `processing/${data.documentId}`;

    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const totalStorage = recentFiles.reduce(
    (total, file) => total + (file.size || 0),
    0
  );

  const thisWeekCount = recentFiles.filter((file) => {
    const uploadDate = new Date(file.date);
    const now = new Date();

    const difference =
      (now - uploadDate) / (1000 * 60 * 60 * 24);

    return difference <= 7;
  }).length;

  return (
    <div className="upload-page">

      {/* ================= SIDEBAR ================= */}

      <aside className="upload-sidebar">

        <a href="#dashboard" className="upload-logo">
          <span className="upload-logo-box">✦</span>
          <span>DocIQ</span>
        </a>

        <div className="upload-menu-label">
          MAIN MENU
        </div>

        <nav className="upload-nav">

          <a href="#dashboard" className="upload-nav-item">
            <span className="nav-icon">▦</span>
            Dashboard
          </a>

          <a href="#documents" className="upload-nav-item">
            <span className="nav-icon">▤</span>
            My Documents
          </a>

          <a href="#upload" className="upload-nav-item active">
            <span className="nav-icon">↑</span>
            Upload Document
          </a>

          <a href="#assistant" className="upload-nav-item">
            <span className="nav-icon">✦</span>
            AI Assistant
          </a>

          <a href="#settings" className="upload-nav-item">
            <span className="nav-icon">⚙</span>
            Settings
          </a>

        </nav>

        <div className="upload-sidebar-bottom">

          <div className="upload-help">

            <div className="help-icon">?</div>

            <strong>Need help?</strong>

            <p>
              Explore DocIQ and learn smarter.
            </p>

            <button type="button">
              Learn more →
            </button>

          </div>

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <main className="upload-content">

        {/* TOPBAR */}

        <header className="upload-topbar">

          <div className="upload-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search your documents..."
            />
          </div>

          <div className="upload-user">

            <div className="upload-user-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>

            <div className="upload-user-text">
              <strong>
                Hello, {userName} 👋
              </strong>

              <span>
                Student
              </span>
            </div>

          </div>

        </header>

        {/* PAGE HEADER */}

        <section className="upload-heading">

          <div>

            <div className="upload-eyebrow">
              DOCUMENT MANAGEMENT
            </div>

            <h1>
              Upload Document
            </h1>

            <p>
              Upload your study materials and let DocIQ turn them into knowledge.
            </p>

          </div>

        </section>

        {/* ================= STATISTICS ================= */}

        <section className="upload-stats">

          <div className="upload-stat-card">

            <div className="upload-stat-icon purple-stat">
              ▤
            </div>

            <div>
              <span>Total Documents</span>
              <strong>{recentFiles.length}</strong>
              <small>Documents uploaded</small>
            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon coral-stat">
              ✦
            </div>

            <div>
              <span>AI Summaries</span>
              <strong>0</strong>
              <small>Summaries generated</small>
            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon green-stat">
              ◷
            </div>

            <div>
              <span>This Week</span>
              <strong>{thisWeekCount}</strong>
              <small>Documents uploaded</small>
            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon orange-stat">
              ◉
            </div>

            <div>
              <span>Storage Used</span>
              <strong>{formatFileSize(totalStorage)}</strong>
              <small>Of your available storage</small>
            </div>

          </div>

        </section>

        {/* ================= UPLOAD + FEATURES ================= */}

        <section className="upload-layout">

          {/* UPLOAD CARD */}

          <div className="upload-main-card">

            <div className="upload-card-heading">

              <div>
                <h2>
                  Upload your document
                </h2>

                <p>
                  PDF, DOC, DOCX and TXT files up to 10 MB
                </p>
              </div>

              <div className="upload-card-badge">
                AI Powered
              </div>

            </div>

            <div
              className={`upload-dropzone ${
                dragActive ? "drag-active" : ""
              } ${selectedFile ? "has-file" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >

              {!selectedFile ? (
                <>

                  <div className="cloud-icon">
                    ↑
                  </div>

                  <h2>
                    Drag & drop your file here
                  </h2>

                  <p>
                    or choose a file from your device
                  </p>

                  <label className="choose-file">

                    Choose File

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      hidden
                    />

                  </label>

                  <span className="supported">
                    Supported formats: PDF, DOC, DOCX, TXT
                  </span>

                  <span className="max-size">
                    Maximum file size: 10 MB
                  </span>

                </>
              ) : (

                <div className="selected-file">

                  <div className="file-icon">
                    {getFileIcon(selectedFile.name)}
                  </div>

                  <div className="file-info">

                    <strong title={selectedFile.name}>
                      {selectedFile.name}
                    </strong>

                    <span>
                      {getFileType(selectedFile.name)} •{" "}
                      {formatFileSize(selectedFile.size)}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="remove-file"
                    onClick={removeFile}
                  >
                    ×
                  </button>

                </div>

              )}

            </div>

            {message && (
              <div
                className={`upload-message ${
                  message.includes("successfully")
                    ? "success"
                    : "error"
                }`}
              >
                {message}
              </div>
            )}

            <button
              className="analyze-button"
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading
                ? "Uploading..."
                : "↑ Upload & Analyze →"}
            </button>

          </div>

          {/* FEATURES */}

          <div className="upload-side-info">

            <div className="side-info-card">

              <div className="side-card-icon purple">
                ✦
              </div>

              <div>
                <strong>
                  AI Summaries
                </strong>

                <p>
                  Get concise summaries from your documents.
                </p>
              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

            <div className="side-info-card">

              <div className="side-card-icon blue">
                ?
              </div>

              <div>
                <strong>
                  Ask Questions
                </strong>

                <p>
                  Chat with your documents using AI.
                </p>
              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

            <div className="side-info-card">

              <div className="side-card-icon green">
                文
              </div>

              <div>
                <strong>
                  Translate
                </strong>

                <p>
                  Translate document content instantly.
                </p>
              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

          </div>

        </section>

        {/* ================= RECENT UPLOADS ================= */}

        <section className="recent-upload-section">

          <div className="recent-header">

            <div>
              <h2>
                Recent Uploads
              </h2>

              <p>
                Your recently uploaded documents
              </p>
            </div>

            <a href="#documents">
              View all →
            </a>

          </div>

          {recentFiles.length === 0 ? (

            <div className="recent-empty">

              <div className="empty-document-icon">
                ▤
              </div>

              <div>
                <strong>
                  No documents uploaded yet
                </strong>

                <p>
                  Upload your first document and it will appear here.
                </p>
              </div>

            </div>

          ) : (

            <div className="recent-list">

              {recentFiles.map((file) => (

                <div
                  className="recent-document"
                  key={file.id}
                >

                  <div className={`recent-file-icon ${file.type ? file.type.toLowerCase() : "file"}`}>
                    {getFileIcon(file.name)}
                  </div>

                  <div className="recent-file-details">

                    <strong title={file.name}>
                      {file.name}
                    </strong>

                    <span>
                      {file.type} • {formatFileSize(file.size)}
                    </span>

                  </div>

                  <div className="recent-upload-date">
                    {formatDate(file.date)}
                  </div>

                  <button
                    type="button"
                    className="recent-view-button"
                    onClick={() => {
                      window.location.hash = `reader/${file.id}`;
                    }}
                  >
                    View
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* ================= HOW IT WORKS ================= */}

        <section className="upload-bottom">

          <div className="bottom-title">

            <div>
              <h2>
                How DocIQ works
              </h2>

              <p>
                Turn your study materials into useful knowledge.
              </p>
            </div>

          </div>

          <div className="steps">

            <div className="step">

              <div className="step-number">
                01
              </div>

              <div>
                <strong>
                  Upload
                </strong>

                <p>
                  Add your notes or study materials.
                </p>
              </div>

            </div>

            <div className="step-arrow">
              →
            </div>

            <div className="step">

              <div className="step-number">
                02
              </div>

              <div>
                <strong>
                  Analyze
                </strong>

                <p>
                  DocIQ extracts and understands your document.
                </p>
              </div>

            </div>

            <div className="step-arrow">
              →
            </div>

            <div className="step">

              <div className="step-number">
                03
              </div>

              <div>
                <strong>
                  Learn
                </strong>

                <p>
                  Summarize, ask questions and translate.
                </p>
              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Upload;