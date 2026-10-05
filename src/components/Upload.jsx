import React, { useState } from "react";
import "./Upload.css";

const API_BASE_URL = "http://localhost:5000";

function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [recentDocuments, setRecentDocuments] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("recentDocuments")
        ) || []
      );
    } catch {
      return [];
    }
  });

  const userName =
    localStorage.getItem("userName") || "Student";

  const allowedExtensions = [
    ".pdf",
    ".docx",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
    ".txt",
  ];

  const maxFileSize = 50 * 1024 * 1024;

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    window.location.hash = "home";
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return "";

    return `.${fileName
      .split(".")
      .pop()
      .toLowerCase()}`;
  };

  const getFileType = (fileName) => {
    const extension =
      getFileExtension(fileName);

    if (extension === ".pdf") return "PDF";
    if (extension === ".doc") return "DOC";
    if (extension === ".docx") return "DOCX";
    if (extension === ".pptx") return "PPTX";
    if ([".png", ".jpg", ".jpeg"].includes(extension)) return "IMAGE";
    if (extension === ".txt") return "TXT";

    return "FILE";
  };

  const getFileIcon = (fileName) => {
    const type = getFileType(fileName);

    if (type === "PDF") return "▤";
    if (type === "DOC") return "▥";
    if (type === "DOCX") return "▥";
    if (type === "TXT") return "▱";

    return "▱";
  };

  const getRecentIconClass = (fileName) => {
    const extension =
      getFileExtension(fileName);

    if (extension === ".pdf") return "pdf";
    if (
      extension === ".doc" ||
      extension === ".docx" ||
      extension === ".pptx" ||
      [".png", ".jpg", ".jpeg"].includes(extension)
    ) {
      return "doc";
    }

    if (extension === ".txt") return "txt";

    return "file";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const mb =
      bytes / (1024 * 1024);

    if (mb < 1) {
      return `${Math.max(
        1,
        Math.round(bytes / 1024)
      )} KB`;
    }

    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date) => {
    if (!date) {
      return "Recently";
    }

    const uploadDate = new Date(date);

    if (
      Number.isNaN(
        uploadDate.getTime()
      )
    ) {
      return "Recently";
    }

    const now = new Date();

    const difference = Math.floor(
      (now - uploadDate) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 0) {
      return "Today";
    }

    if (difference === 1) {
      return "Yesterday";
    }

    if (
      difference > 1 &&
      difference < 7
    ) {
      return `${difference} days ago`;
    }

    return uploadDate.toLocaleDateString();
  };

  const validateFile = (file) => {
    if (!file) {
      showMessage(
        "Please select a document first.",
        "error"
      );
      return false;
    }

    const extension =
      getFileExtension(file.name);

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      showMessage(
        "Unsupported file type. Please upload PDF, DOCX, PPTX, or TXT files. Older DOC/PPT files must be saved in the newer format first.",
        "error"
      );
      return false;
    }

    if (file.size > maxFileSize) {
      showMessage(
        "File is too large. Maximum file size is 50 MB.",
        "error"
      );
      return false;
    }

    return true;
  };

  const selectFile = (file) => {
    clearMessage();

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event) => {
    const file =
      event.target.files?.[0];

    selectFile(file);

    event.target.value = "";
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setDragActive(false);

    const file =
      event.dataTransfer.files?.[0];

    selectFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    clearMessage();
  };

  const handleUpload = async () => {
    if (!validateFile(selectedFile)) {
      return;
    }

    try {
      setUploading(true);
      clearMessage();

      const formData = new FormData();

      formData.append(
        "document",
        selectedFile
      );

      const response = await fetch(
        `${API_BASE_URL}/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Upload failed."
        );
      }

      const newDocument = {
        id: data.documentId,
        name:
          data.file?.originalName ||
          selectedFile.name,
        size:
          data.file?.size ||
          selectedFile.size,
        type:
          data.file?.type ||
          getFileType(
            selectedFile.name
          ),
        date: new Date().toISOString(),
        status: "processing",
      };

      const updatedDocuments = [
        newDocument,
        ...recentDocuments.filter(
          (document) =>
            document.id !==
            newDocument.id
        ),
      ].slice(0, 5);

      setRecentDocuments(
        updatedDocuments
      );

      localStorage.setItem(
        "recentDocuments",
        JSON.stringify(
          updatedDocuments
        )
      );

      showMessage(
        "Document uploaded successfully. Processing started.",
        "success"
      );

      setSelectedFile(null);

      /*
       * Wait briefly so the success message
       * can be seen before moving to processing.
       */
      setTimeout(() => {
        window.location.hash =
          `processing/${data.documentId}`;
      }, 700);
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to upload the document. Please try again.",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleViewRecent = (documentId) => {
    if (!documentId) {
      showMessage(
        "This document does not have a valid ID.",
        "error"
      );
      return;
    }

    window.location.hash =
      `reader/${documentId}`;
  };

  return (
    <div className="upload-page">

      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">

        <a
          href="#dashboard"
          className="dashboard-logo"
        >
          <span className="dashboard-logo-icon">
            ✦
          </span>

          <span>
            DocIQ
          </span>
        </a>

        <div className="dashboard-menu-title">
          MAIN MENU
        </div>

        <nav className="dashboard-menu">

          <a
            href="#dashboard"
            className="dashboard-menu-item"
          >
            <span>🏠</span>
            Dashboard
          </a>

          <a
            href="#documents"
            className="dashboard-menu-item"
          >
            <span>📄</span>
            My Documents
          </a>

          <a
            href="#upload"
            className="dashboard-menu-item active"
          >
            <span>📤</span>
            Upload Document
          </a>

          <a
            href="#study"
            className="dashboard-menu-item"
          >
            <span>🎓</span>
            Study Hub
          </a>

          <a
            href="#assistant"
            className="dashboard-menu-item"
          >
            <span>🤖</span>
            AI Assistant
          </a>

          <a
            href="#settings"
            className="dashboard-menu-item"
          >
            <span>⚙️</span>
            Settings
          </a>

        </nav>

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

            <button type="button">
              Learn more →
            </button>

          </div>

          <button
            className="dashboard-logout"
            type="button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="upload-content">

        {/* TOP BAR */}
        <div className="upload-topbar">

          <div className="upload-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search documents..."
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  window.location.hash =
                    "documents";
                }
              }}
            />
          </div>

          <div className="upload-user">

            <div className="upload-user-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="upload-user-text">

              <strong>
                {userName}
              </strong>

              <span>
                Student
              </span>

            </div>

          </div>

        </div>

        {/* HEADING */}
        <section className="upload-heading">

          <div className="upload-eyebrow">
            ADD TO YOUR LIBRARY
          </div>

          <h1>
            Upload Document
          </h1>

          <p>
            Upload your study material and
            let DocIQ help you read,
            understand, and study it.
          </p>

        </section>

        {/* STATISTICS */}
        <section className="upload-stats">

          <div className="upload-stat-card">

            <div className="upload-stat-icon purple-stat">
              📚
            </div>

            <div>

              <span>
                TOTAL DOCUMENTS
              </span>

              <strong>
                {recentDocuments.length}
              </strong>

              <small>
                In your library
              </small>

            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon coral-stat">
              ↑
            </div>

            <div>

              <span>
                UPLOAD LIMIT
              </span>

              <strong>
                50 MB
              </strong>

              <small>
                Maximum file size
              </small>

            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon green-stat">
              ✓
            </div>

            <div>

              <span>
                SUPPORTED
              </span>

              <strong>
                7 Types
              </strong>

              <small>
                PDF, DOCX, PPTX, images, TXT
              </small>

            </div>

          </div>

          <div className="upload-stat-card">

            <div className="upload-stat-icon orange-stat">
              ✦
            </div>

            <div>

              <span>
                AI READY
              </span>

              <strong>
                Yes
              </strong>

              <small>
                After processing
              </small>

            </div>

          </div>

        </section>

        {/* UPLOAD LAYOUT */}
        <section className="upload-layout">

          {/* MAIN UPLOAD CARD */}
          <div className="upload-main-card">

            <div className="upload-card-heading">

              <div>

                <h2>
                  Select your document
                </h2>

                <p>
                  Choose a file to add to
                  your DocIQ library.
                </p>

              </div>

              <span className="upload-card-badge">
                MAX 50 MB
              </span>

            </div>

            {/* DROPZONE */}
            <div
              className={`upload-dropzone ${
                selectedFile
                  ? "has-file"
                  : ""
              } ${
                dragActive
                  ? "drag-active"
                  : ""
              }`}
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={handleDrop}
            >

              {!selectedFile ? (

                <>
                  <div className="cloud-icon">
                    ☁
                  </div>

                  <h2>
                    Drag & drop your file here
                  </h2>

                  <p>
                    or choose a file from
                    your computer
                  </p>

                  <label className="choose-file">

                    Choose File

                    <input
                      type="file"
                      accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.txt"
                      onChange={
                        handleFileChange
                      }
                      hidden
                    />

                  </label>

                  <div className="supported">
                    Supported: PDF, DOCX,
                    PPTX, PNG, JPG, JPEG, TXT
                  </div>

                  <div className="max-size">
                    Maximum file size: 50 MB
                  </div>
                </>

              ) : (

                <div className="selected-file">

                  <div className="file-icon">
                    {getFileIcon(
                      selectedFile.name
                    )}
                  </div>

                  <div className="file-info">

                    <strong>
                      {selectedFile.name}
                    </strong>

                    <span>
                      {getFileType(
                        selectedFile.name
                      )}{" "}
                      •{" "}
                      {formatFileSize(
                        selectedFile.size
                      )}
                    </span>

                  </div>

                  <button
                    type="button"
                    className="remove-file"
                    onClick={
                      handleRemoveFile
                    }
                    disabled={uploading}
                    title="Remove file"
                  >
                    ×
                  </button>

                </div>

              )}

            </div>

            {/* MESSAGE */}
            {message && (
              <div
                className={`upload-message ${messageType}`}
              >
                {message}
              </div>
            )}

            {/* ANALYZE BUTTON */}
            <button
              type="button"
              className="analyze-button"
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                uploading
              }
            >
              {uploading
                ? "Uploading & Processing..."
                : "Upload & Analyze Document →"}
            </button>

          </div>

          {/* SIDE INFORMATION */}
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
                  Turn long documents
                  into clear summaries.
                </p>

              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

            <div className="side-info-card">

              <div className="side-card-icon blue">
                🔍
              </div>

              <div>

                <strong>
                  Smart Search
                </strong>

                <p>
                  Find important
                  information quickly.
                </p>

              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

            <div className="side-info-card">

              <div className="side-card-icon green">
                🎓
              </div>

              <div>

                <strong>
                  Study Tools
                </strong>

                <p>
                  Create notes, MCQs,
                  and flashcards.
                </p>

              </div>

              <span className="side-arrow">
                →
              </span>

            </div>

          </div>

        </section>

        {/* RECENT UPLOADS */}
        <section className="recent-upload-section">

          <div className="recent-header">

            <div>

              <h2>
                Recent Uploads
              </h2>

              <p>
                Your latest documents
              </p>

            </div>

            <a href="#documents">
              View all →
            </a>

          </div>

          {recentDocuments.length === 0 ? (

            <div className="recent-empty">

              <div className="empty-document-icon">
                ▤
              </div>

              <div>

                <strong>
                  No documents uploaded yet
                </strong>

                <p>
                  Upload your first document
                  to see it here.
                </p>

              </div>

            </div>

          ) : (

            <div className="recent-list">

              {recentDocuments
                .slice(0, 5)
                .map((document) => (

                  <div
                    className="recent-document"
                    key={
                      document.id ||
                      document.name
                    }
                  >

                    <div
                      className={`recent-file-icon ${getRecentIconClass(
                        document.name
                      )}`}
                    >
                      {getFileIcon(
                        document.name
                      )}
                    </div>

                    <div className="recent-file-details">

                      <strong>
                        {document.name}
                      </strong>

                      <span>
                        {document.type ||
                          getFileType(
                            document.name
                          )}{" "}
                        •{" "}
                        {formatFileSize(
                          document.size
                        )}
                      </span>

                    </div>

                    <span className="recent-upload-date">
                      {formatDate(
                        document.date
                      )}
                    </span>

                    <button
                      type="button"
                      className="recent-view-button"
                      onClick={() =>
                        handleViewRecent(
                          document.id
                        )
                      }
                    >
                      View
                    </button>

                  </div>

                ))}

            </div>

          )}

        </section>

        {/* HOW DOCIQ WORKS */}
        <section className="upload-bottom">

          <div className="bottom-title">

            <h2>
              How DocIQ works
            </h2>

            <p>
              From document to understanding
              in three simple steps.
            </p>

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
                  Add a PDF, DOCX, PPTX,
                  or TXT file.
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
                  Process
                </strong>

                <p>
                  DocIQ extracts and
                  prepares your content.
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
                  Read, search, ask AI,
                  and study smarter.
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
