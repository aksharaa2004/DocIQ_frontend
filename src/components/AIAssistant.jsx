import { useEffect, useRef, useState } from "react";
import { Bubble, Sender } from "@ant-design/x";
import { marked } from "marked";
import DOMPurify from "dompurify";
import "./Upload.css";
import "./AIAssistant.css";

const API_BASE_URL = "http://localhost:5000";

export default function AIAssistant() {
  const userName = localStorage.getItem("userName") || "Student";
  const [messages, setMessages] = useState([
    {
      key: "welcome",
      role: "assistant",
      content: "Hi! I’m your DocIQ study assistant. Ask me anything, or paste a concept you’d like explained.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    const loadDocuments = () => {
      if (inFlight) return;
      inFlight = true;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      fetch(`${API_BASE_URL}/api/documents`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          if (!data.documents) throw new Error(data.message || "Could not load your documents.");
          if (active) setDocumentsError("");
          if (active) setDocuments(Array.isArray(data.documents) ? data.documents : []);
        })
        .catch((loadError) => {
          if (active) setDocumentsError(loadError.name === "AbortError" ? "Document loading timed out. Check that the backend and MongoDB are running." : loadError.message || "Could not load your documents.");
        })
        .finally(() => {
          window.clearTimeout(timeout);
          inFlight = false;
          if (active) setDocumentsLoading(false);
        });
    };
    loadDocuments();
    const interval = window.setInterval(loadDocuments, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (value) => {
    const content = value.trim();
    if (!content || loading) return;

    setDraft("");
    const history = [...messages, { key: `${Date.now()}`, role: "user", content }];
    setMessages(history);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history
            .filter((message) => message.key !== "welcome")
            .slice(-10)
            .map(({ role, content: messageContent }) => ({ role, content: messageContent.slice(0, 4000) })),
          documentId: selectedDocumentId || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "The assistant could not respond.");
      setMessages((current) => [
        ...current,
        { key: `${Date.now()}-reply`, role: "assistant", content: data.reply },
      ]);
    } catch (sendError) {
      setError(sendError.message || "Unable to reach the assistant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page assistant-layout">
      <aside className="dashboard-sidebar">
        <a href="#dashboard" className="dashboard-logo">
          <span className="dashboard-logo-icon">✦</span>
          <span>DocIQ</span>
        </a>
        <div className="dashboard-menu-title">MAIN MENU</div>
        <nav className="dashboard-menu">
          <a href="#dashboard" className="dashboard-menu-item"><span>▦</span>Dashboard</a>
          <a href="#documents" className="dashboard-menu-item"><span>▤</span>My Documents</a>
          <a href="#upload" className="dashboard-menu-item"><span>↑</span>Upload Document</a>
          <a href="#study" className="dashboard-menu-item"><span>🎓</span>Study Hub</a>
          <a href="#assistant" className="dashboard-menu-item active"><span>✦</span>AI Assistant</a>
          <a href="#settings" className="dashboard-menu-item"><span>⚙</span>Settings</a>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-help-card">
            <div className="dashboard-help-icon">?</div>
            <strong>Need help?</strong>
            <p>Explore DocIQ and learn smarter.</p>
            <button type="button" onClick={() => { window.location.hash = "study"; }}>Learn more →</button>
          </div>
          <button
            className="dashboard-logout"
            type="button"
            onClick={() => {
              localStorage.removeItem("userName");
              localStorage.removeItem("token");
              window.location.hash = "home";
            }}
          >
            <span>↪</span>Logout
          </button>
        </div>
      </aside>

      <main className="upload-content assistant-page">
        <div className="upload-topbar">
          <div className="upload-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search documents..."
              onKeyDown={(event) => {
                if (event.key === "Enter") window.location.hash = "documents";
              }}
            />
          </div>
          <div className="upload-user">
            <div className="upload-user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="upload-user-text"><strong>{userName}</strong><span>Student</span></div>
          </div>
        </div>

        <section className="upload-heading assistant-page-heading">
          <div className="upload-eyebrow">AI-POWERED LEARNING</div>
          <div className="assistant-title-row">
            <h1>AI Assistant</h1>
            <span className="assistant-provider">Powered by Groq</span>
          </div>
          <p>Ask questions or choose a document to study with DocIQ.</p>
        </section>

      <section className="assistant-chat" aria-label="Chat with the AI assistant">
        <div className="assistant-document-picker">
          <label htmlFor="assistant-document">Ask about a document</label>
          <select
            id="assistant-document"
            value={selectedDocumentId}
            onChange={(event) => {
              setSelectedDocumentId(event.target.value);
              setMessages([{ key: "welcome", role: "assistant", content: event.target.value ? "I’ll answer using the selected document. What would you like to know?" : "Hi! I’m your DocIQ study assistant. Ask me anything, or paste a concept you’d like explained." }]);
              setError("");
            }}
          >
            <option value="">General study chat</option>
            {documents.length === 0 && (
              <option value="" disabled>No documents found yet</option>
            )}
            {documents.map((document) => (
              <option key={document.id} value={document.id} disabled={document.status !== "ready"}>
                {document.name}{document.status === "processing" ? " (processing)" : document.status === "failed" ? " (failed)" : ""}
              </option>
            ))}
          </select>
          {documentsLoading && <span>Loading documents…</span>}
          {!documentsLoading && documentsError && <span role="alert">{documentsError} Retrying automatically…</span>}
          {!documentsLoading && !documentsError && documents.length === 0 && (
            <button className="assistant-upload-link" type="button" onClick={() => { window.location.hash = "upload"; }}>
              Upload a document
            </button>
          )}
          {documents.length > 0 && !documents.some((document) => document.status === "ready") && (
            <span>Documents are still processing or need to be uploaded again.</span>
          )}
          {selectedDocumentId && <span>Extracted text and OCR results are sent to Groq to answer your questions.</span>}
        </div>
        <div className="assistant-messages" ref={scrollRef}>
          <Bubble.List
            items={messages.map(({ key, role, content }) => ({
              key,
              role: role === "user" ? "user" : "assistant",
              content: role === "assistant" ? (
                <div
                  className="assistant-markdown"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(content, { async: false, breaks: true })),
                  }}
                />
              ) : content,
            }))}
            roles={{
              user: { placement: "end", variant: "filled", shape: "round" },
              assistant: { placement: "start", variant: "filled", shape: "round" },
            }}
          />
          {loading && <Bubble loading placement="start" />}
        </div>
        {error && <p className="assistant-error" role="alert">{error}</p>}
        <div className="assistant-composer">
          <Sender
            value={draft}
            onChange={setDraft}
            placeholder="Message your study assistant…"
            onSubmit={sendMessage}
            loading={loading}
            autoSize={{ minRows: 1, maxRows: 5 }}
          />
          <p>AI responses can make mistakes. Check important information against your sources.</p>
        </div>
      </section>
      </main>
    </div>
  );
}
