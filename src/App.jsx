import { useState, useEffect } from "react";

import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";
import Documents from "./components/Document";
import Reader from "./components/Reader";
import Processing from "./components/Processing";
import StudyHub from "./components/StudyHub";
import AIAssistant from "./components/AIAssistant";

function App() {
  const getCurrentPage = () => {
    const hash = window.location.hash;

    if (hash === "#login") {
      return "login";
    }

    if (hash === "#signup") {
      return "signup";
    }

    if (hash === "#dashboard") {
      return "dashboard";
    }

    if (hash === "#upload") {
      return "upload";
    }

    if (hash === "#documents") {
      return "documents";
    }

    if (hash.startsWith("#processing/")) {
      return "processing";
    }

    if (hash.startsWith("#reader/")) {
      return "reader";
    }

    if (hash.startsWith("#study/")) {
      return "study";
    }

    if (hash === "#study") {
      return "study";
    }

    if (hash === "#assistant") {
      return "assistant";
    }

    if (hash === "#settings") {
      return "settings";
    }

    return "home";
  };

  const [page, setPage] = useState(getCurrentPage);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getCurrentPage());
    };

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  /*
   * Get the document ID from:
   *
   * #reader/123
   *
   * Result:
   *
   * 123
   */
  const getReaderDocumentId = () => {
    const hash = window.location.hash;

    if (!hash.startsWith("#reader/")) {
      return null;
    }

    return hash.replace("#reader/", "");
  };

  const readerDocumentId = getReaderDocumentId();

  return (
    <div>

      {/* ================= HOME ================= */}

      {page === "home" && <Home />}


      {/* ================= LOGIN ================= */}

      {page === "login" && <Login />}


      {/* ================= SIGNUP ================= */}

      {page === "signup" && <Signup />}


      {/* ================= DASHBOARD ================= */}

      {page === "dashboard" && <Dashboard />}


      {/* ================= UPLOAD ================= */}

      {page === "upload" && <Upload />}


      {/* ================= DOCUMENTS ================= */}

      {page === "documents" && <Documents />}


      {/* ================= PROCESSING ================= */}

      {page === "processing" && <Processing />}


      {/* ================= READER ================= */}

      {page === "reader" && (
        <Reader documentId={readerDocumentId} />
      )}


      {/* ================= STUDY HUB ================= */}

      {page === "study" && <StudyHub />}


      {/* ================= AI ASSISTANT ================= */}

      {page === "assistant" && <AIAssistant />}

      {/* ================= SETTINGS ================= */}

      {page === "settings" && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px",
            boxSizing: "border-box",
            background: "#fffaf5",
            color: "#30243b",
            fontFamily:
              '"Inter", "Segoe UI", sans-serif',
            textAlign: "center",
          }}
        >
          <div>
            <div
              style={{
                width: "60px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                borderRadius: "16px",
                background: "#f9e1d8",
                color: "#4b254f",
                fontSize: "25px",
              }}
            >
              ⚙
            </div>

            <h1
              style={{
                margin: "0 0 10px",
                color: "#4b254f",
                fontSize: "24px",
              }}
            >
              Settings
            </h1>

            <p
              style={{
                margin: "0 0 20px",
                color: "#8f7d8b",
                fontSize: "13px",
              }}
            >
              Settings will be
              added here next.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.hash = "dashboard";
              }}
              style={{
                marginTop: "5px",
                padding: "11px 17px",
                border: "none",
                borderRadius: "9px",
                background: "#4b254f",
                color: "white",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
