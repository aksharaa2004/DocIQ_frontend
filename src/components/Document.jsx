import React, { useEffect, useMemo, useState } from "react";
import "./Document.css";

const API_BASE_URL = "http://localhost:5000";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [openingId, setOpeningId] = useState(null);

  const userName =
    localStorage.getItem("userName") || "Student";

  /* =========================
     NAVIGATION
  ========================= */

  const navigateTo = (path) => {
    window.location.hash = path;
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("token");

    navigateTo("home");
  };

  /* =========================
     FILE TYPE
  ========================= */

  const getFileType = (fileName) => {
    const extension =
      fileName?.split(".").pop()?.toLowerCase();

    if (extension === "pdf") return "PDF";
    if (extension === "doc") return "DOC";
    if (extension === "docx") return "DOCX";
    if (extension === "ppt") return "PPT";
    if (extension === "pptx") return "PPTX";
    if (extension === "txt") return "TXT";

    if (
      ["jpg", "jpeg", "png", "webp"].includes(
        extension
      )
    ) {
      return "IMAGE";
    }

    return "FILE";
  };

  /* =========================
     FILE ICON
  ========================= */

  const getFileIcon = (fileName) => {
    const type = getFileType(fileName);

    if (type === "PDF") return "▤";

    if (
      type === "DOC" ||
      type === "DOCX"
    ) {
      return "▥";
    }

    if (
      type === "PPT" ||
      type === "PPTX"
    ) {
      return "▦";
    }

    if (type === "IMAGE") {
      return "▧";
    }

    return "▱";
  };

  /* =========================
     FILE SIZE
  ========================= */

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const mb = bytes / (1024 * 1024);

    if (mb < 1) {
      return `${Math.max(
        1,
        Math.round(bytes / 1024)
      )} KB`;
    }

    return `${mb.toFixed(1)} MB`;
  };

  /* =========================
     UPLOAD DATE
  ========================= */

  const formatDate = (date) => {
    if (!date) {
      return "Recently uploaded";
    }

    const uploadDate = new Date(date);

    if (
      Number.isNaN(
        uploadDate.getTime()
      )
    ) {
      return "Recently uploaded";
    }

    const now = new Date();

    const difference = Math.floor(
      (now - uploadDate) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 0) {
      return "Uploaded today";
    }

    if (difference === 1) {
      return "Uploaded yesterday";
    }

    if (
      difference > 1 &&
      difference < 7
    ) {
      return `Uploaded ${difference} days ago`;
    }

    return uploadDate.toLocaleDateString();
  };

  /* =========================
     LAST OPENED DATE
  ========================= */

  const formatLastOpened = (date) => {
    if (!date) {
      return "Not opened yet";
    }

    const openedDate = new Date(date);

    if (
      Number.isNaN(
        openedDate.getTime()
      )
    ) {
      return "Not opened yet";
    }

    const now = new Date();

    const difference = Math.floor(
      (now - openedDate) /
        (1000 * 60 * 60 * 24)
    );

    if (difference === 0) {
      return "Opened today";
    }

    if (difference === 1) {
      return "Opened yesterday";
    }

    if (
      difference > 1 &&
      difference < 7
    ) {
      return `Opened ${difference} days ago`;
    }

    return openedDate.toLocaleDateString();
  };

  /* =========================
     FETCH DOCUMENTS
  ========================= */

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/documents`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load documents."
        );
      }

      const documentList =
        Array.isArray(data)
          ? data
          : Array.isArray(data.documents)
          ? data.documents
          : [];

      setDocuments(documentList);

      /*
       * localStorage is only used as a
       * compatibility/fallback cache.
       *
       * MongoDB remains the source of truth.
       */
      try {
        localStorage.setItem(
          "recentDocuments",
          JSON.stringify(
            documentList.slice(0, 10)
          )
        );
      } catch {
        // Ignore localStorage errors.
      }
    } catch (error) {
      console.error(
        "Fetch documents error:",
        error
      );

      setError(
        error.message ||
          "Unable to load your documents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  /* =========================
     SEARCH
  ========================= */

  const handleSearch = (event) => {
    event?.preventDefault();

    setSearchQuery(
      searchInput.trim()
    );
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const filteredDocuments =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      if (!query) {
        return documents;
      }

      return documents.filter(
        (document) => {
          const name =
            document.name
              ?.toLowerCase() || "";

          const type =
            document.type
              ?.toLowerCase() || "";

          const fileName =
            document.fileName
              ?.toLowerCase() || "";

          return (
            name.includes(query) ||
            type.includes(query) ||
            fileName.includes(query)
          );
        }
      );
    }, [
      documents,
      searchQuery,
    ]);

  /* =========================
     RECENT OPEN DOCUMENTS
  ========================= */

  const recentDocuments =
    useMemo(() => {
      return [...documents]
        .filter(
          (document) =>
            document.lastOpenedAt
        )
        .sort(
          (a, b) =>
            new Date(
              b.lastOpenedAt
            ) -
            new Date(
              a.lastOpenedAt
            )
        )
        .slice(0, 5);
    }, [documents]);

  /* =========================
     MARK AS OPENED
  ========================= */

  const markDocumentAsOpened =
    async (documentId) => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}/open`,
            {
              method: "PATCH",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to update recent documents."
          );
        }

        const openedAt =
          data.document?.lastOpenedAt ||
          new Date().toISOString();

        setDocuments(
          (currentDocuments) =>
            currentDocuments.map(
              (document) =>
                document.id ===
                documentId
                  ? {
                      ...document,
                      lastOpenedAt:
                        openedAt,
                    }
                  : document
            )
        );

        return true;
      } catch (error) {
        console.error(
          "Mark document opened error:",
          error
        );

        /*
         * Opening the document should still
         * work even if the history update fails.
         */
        return false;
      }
    };

  /* =========================
     OPEN DOCUMENT
  ========================= */

  const handleOpenDocument =
    async (documentId) => {
      if (!documentId) {
        alert(
          "This document cannot be opened because its ID is missing."
        );
        return;
      }

      try {
        setOpeningId(documentId);

        await markDocumentAsOpened(
          documentId
        );

        /*
         * Keep localStorage updated for
         * compatibility with other pages.
         */
        const document =
          documents.find(
            (item) =>
              item.id === documentId
          );

        if (document) {
          try {
            const existing =
              JSON.parse(
                localStorage.getItem(
                  "recentDocuments"
                )
              ) || [];

            const updated = [
              {
                ...document,
                lastOpenedAt:
                  new Date().toISOString(),
              },
              ...existing.filter(
                (item) =>
                  item.id !==
                  documentId
              ),
            ].slice(0, 10);

            localStorage.setItem(
              "recentDocuments",
              JSON.stringify(updated)
            );
          } catch {
            // Ignore localStorage errors.
          }
        }

        navigateTo(
          `reader/${documentId}`
        );
      } finally {
        setOpeningId(null);
      }
    };

  /* =========================
     STUDY DOCUMENT
  ========================= */

  const handleStudyDocument =
    (documentId) => {
      if (!documentId) {
        alert(
          "This document cannot be studied because its ID is missing."
        );
        return;
      }

      navigateTo(
        `study/${documentId}`
      );
    };

  /* =========================
     DELETE DOCUMENT
  ========================= */

  const handleDeleteDocument =
    async (documentId) => {
      const documentToDelete =
        documents.find(
          (document) =>
            document.id ===
            documentId
        );

      if (!documentToDelete) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete "${documentToDelete.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          documentId
        );

        setError("");

        const response =
          await fetch(
            `${API_BASE_URL}/api/documents/${documentId}`,
            {
              method: "DELETE",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to delete the document."
          );
        }

        setDocuments(
          (currentDocuments) =>
            currentDocuments.filter(
              (document) =>
                document.id !==
                documentId
            )
        );

        /*
         * Remove deleted document from
         * localStorage history as well.
         */
        try {
          const recentDocuments =
            JSON.parse(
              localStorage.getItem(
                "recentDocuments"
              )
            ) || [];

          const updatedDocuments =
            recentDocuments.filter(
              (document) =>
                document.id !==
                documentId
            );

          localStorage.setItem(
            "recentDocuments",
            JSON.stringify(
              updatedDocuments
            )
          );
        } catch {
          // Ignore localStorage errors.
        }
      } catch (error) {
        console.error(
          "Delete document error:",
          error
        );

        setError(
          error.message ||
            "Unable to delete the document."
        );
      } finally {
        setDeletingId(null);
      }
    };

  return (
    <div className="documents-page">

      {/* =========================
          SIDEBAR
      ========================= */}

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
            <span>▦</span>
            Dashboard
          </a>

          <a
            href="#documents"
            className="dashboard-menu-item active"
          >
            <span>▤</span>
            My Documents
          </a>

          <a
            href="#upload"
            className="dashboard-menu-item"
          >
            <span>↑</span>
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
            <span>✦</span>
            AI Assistant
          </a>

          <a
            href="#settings"
            className="dashboard-menu-item"
          >
            <span>⚙</span>
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
              Explore DocIQ and
              learn smarter.
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

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="documents-content">

        {/* TOP BAR */}

        <div className="documents-topbar">

          <div className="documents-breadcrumb">

            <span>
              Documents
            </span>

            <span>
              /
            </span>

            <strong>
              My Documents
            </strong>

          </div>

          <div className="documents-user">

            <div className="documents-user-avatar">
              {userName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <strong>
                {userName}
              </strong>

              <span>
                Student
              </span>

            </div>

          </div>

        </div>

        {/* PAGE HEADER */}

        <section className="documents-header">

          <div>

            <span className="documents-eyebrow">
              YOUR LIBRARY
            </span>

            <h1>
              My Documents
            </h1>

            <p>
              Access, read, search,
              and study your
              uploaded documents.
            </p>

          </div>

          <a
            href="#upload"
            className="documents-upload-button"
          >
            <span>
              ↑
            </span>

            Upload Document
          </a>

        </section>

        {/* ERROR */}

        {error && (
          <div className="documents-error">

            <span>
              ⚠
            </span>

            <div>

              <strong>
                Something went wrong
              </strong>

              <p>
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={fetchDocuments}
            >
              Retry
            </button>

          </div>
        )}

        {/* =========================
            SEARCH
        ========================= */}

        <section className="documents-toolbar">

          <form
            className="documents-search"
            onSubmit={handleSearch}
          >

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search your documents..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleSearch(event);
                }
              }}
            />

            {searchInput && (
              <button
                type="button"
                className="documents-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}

            <button
              type="submit"
              className="documents-search-button"
            >
              Search
            </button>

          </form>

          <div className="documents-count">

            <strong>
              {filteredDocuments.length}
            </strong>

            <span>
              {filteredDocuments.length ===
              1
                ? "document"
                : "documents"}
            </span>

          </div>

        </section>

        {/* SEARCH RESULT */}

        {!loading &&
          searchQuery && (
            <div className="documents-search-result">

              <span>
                Search results for:
              </span>

              <strong>
                "{searchQuery}"
              </strong>

              <button
                type="button"
                onClick={
                  handleClearSearch
                }
              >
                Clear
              </button>

            </div>
          )}

        {/* =========================
            RECENT OPEN DOCUMENTS
        ========================= */}

        {!loading &&
          !searchQuery &&
          recentDocuments.length >
            0 && (

            <section className="documents-recent">

              <div className="documents-section-heading">

                <div>

                  <span className="documents-eyebrow">
                    RECENTLY OPENED
                  </span>

                  <h2>
                    Recent Open Documents
                  </h2>

                  <p>
                    Quickly reopen documents
                    you viewed recently.
                  </p>

                </div>

              </div>

              <div className="documents-recent-list">

                {recentDocuments.map(
                  (document) => (

                    <div
                      className="documents-recent-item"
                      key={
                        document.id
                      }
                    >

                      <div className="documents-recent-icon">
                        {getFileIcon(
                          document.name
                        )}
                      </div>

                      <div className="documents-recent-details">

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
                          )}{" "}
                          •{" "}
                          {formatLastOpened(
                            document.lastOpenedAt
                          )}
                        </span>

                      </div>

                      <button
                        type="button"
                        className="documents-recent-open"
                        onClick={() =>
                          handleOpenDocument(
                            document.id
                          )
                        }
                        disabled={
                          openingId ===
                          document.id
                        }
                      >
                        {openingId ===
                        document.id
                          ? "Opening..."
                          : "Open"}
                      </button>

                    </div>

                  )
                )}

              </div>

            </section>
          )}

        {/* =========================
            ALL DOCUMENTS
        ========================= */}

        <section className="documents-all-section">

          <div className="documents-section-heading">

            <div>

              <span className="documents-eyebrow">
                LIBRARY
              </span>

              <h2>
                {searchQuery
                  ? "Search Results"
                  : "All Documents"}
              </h2>

              <p>
                {searchQuery
                  ? "Documents matching your search."
                  : "Every document you have uploaded to DocIQ."}
              </p>

            </div>

          </div>

          {/* =========================
              LOADING
          ========================= */}

          {loading ? (

            <section className="documents-empty">

              <div className="documents-empty-icon">
                ⟳
              </div>

              <h2>
                Loading documents...
              </h2>

              <p>
                Fetching your
                documents from the
                DocIQ server.
              </p>

            </section>

          ) : filteredDocuments.length >
            0 ? (

            <section className="documents-list">

              {filteredDocuments.map(
                (document) => {

                  const fileType =
                    document.type ||
                    getFileType(
                      document.name
                    );

                  const isDeleting =
                    deletingId ===
                    document.id;

                  const isOpening =
                    openingId ===
                    document.id;

                  return (
                    <article
                      className="document-card"
                      key={
                        document.id ||
                        document.name
                      }
                    >

                      <div className="document-card-main">

                        <div className="document-icon">
                          {getFileIcon(
                            document.name
                          )}
                        </div>

                        <div className="document-details">

                          <h3>
                            {document.name}
                          </h3>

                          <div className="document-meta">

                            <span>
                              {fileType}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatFileSize(
                                document.size
                              )}
                            </span>

                            <span>
                              •
                            </span>

                            <span>
                              {formatDate(
                                document.date
                              )}
                            </span>

                            {document.status && (
                              <>
                                <span>
                                  •
                                </span>

                                <span className="document-status">
                                  {document.status}
                                </span>
                              </>
                            )}

                          </div>

                          {document.lastOpenedAt && (
                            <div className="document-last-opened">
                              {formatLastOpened(
                                document.lastOpenedAt
                              )}
                            </div>
                          )}

                        </div>

                      </div>

                      <div className="document-card-actions">

                        <button
                          type="button"
                          className="document-action secondary"
                          onClick={() =>
                            handleStudyDocument(
                              document.id
                            )
                          }
                          disabled={
                            isDeleting ||
                            isOpening
                          }
                        >
                          🎓 Study
                        </button>

                        <button
                          type="button"
                          className="document-action primary"
                          onClick={() =>
                            handleOpenDocument(
                              document.id
                            )
                          }
                          disabled={
                            isDeleting ||
                            isOpening
                          }
                        >
                          {isOpening
                            ? "Opening..."
                            : "Open"}
                        </button>

                        <button
                          type="button"
                          className="document-delete"
                          onClick={() =>
                            handleDeleteDocument(
                              document.id
                            )
                          }
                          disabled={
                            isDeleting ||
                            isOpening
                          }
                          aria-label={`Delete ${document.name}`}
                          title={
                            isDeleting
                              ? "Deleting..."
                              : "Delete document"
                          }
                        >
                          {isDeleting
                            ? "..."
                            : "🗑"}
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </section>

          ) : (

            /* =========================
               EMPTY STATE
            ========================= */

            <section className="documents-empty">

              <div className="documents-empty-icon">
                {searchQuery
                  ? "⌕"
                  : "▤"}
              </div>

              {searchQuery ? (
                <>
                  <h2>
                    No documents found
                  </h2>

                  <p>
                    We couldn't find
                    any document
                    matching "
                    {searchQuery}".
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleClearSearch
                    }
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h2>
                    No documents yet
                  </h2>

                  <p>
                    Upload your first
                    document to start
                    reading and
                    studying with
                    DocIQ.
                  </p>

                  <a href="#upload">
                    ↑ Upload Your First
                    Document
                  </a>
                </>
              )}

            </section>
          )}

        </section>

        {/* =========================
            QUICK INFORMATION
        ========================= */}

        {!loading &&
          documents.length > 0 && (

            <section className="documents-info-grid">

              <div className="documents-info-card">

                <div className="documents-info-icon">
                  📚
                </div>

                <div>

                  <strong>
                    {documents.length}
                  </strong>

                  <span>
                    Total Documents
                  </span>

                </div>

              </div>

              <div className="documents-info-card">

                <div className="documents-info-icon">
                  🎓
                </div>

                <div>

                  <strong>
                    Study Ready
                  </strong>

                  <span>
                    Turn documents into
                    study materials
                  </span>

                </div>

              </div>

              <div className="documents-info-card">

                <div className="documents-info-icon">
                  ✨
                </div>

                <div>

                  <strong>
                    AI Ready
                  </strong>

                  <span>
                    Ask questions and
                    understand content
                  </span>

                </div>

              </div>

            </section>
          )}

        {/* =========================
            TIP
        ========================= */}

        <section className="documents-tip">

          <div className="documents-tip-icon">
            💡
          </div>

          <div>

            <strong>
              What can you do with
              a document?
            </strong>

            <p>
              Open a document to
              read it, search for
              information, use AI
              tools, highlight
              important content,
              bookmark sections, or
              create study materials.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Documents;