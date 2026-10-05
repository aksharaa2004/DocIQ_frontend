import { useEffect, useState } from "react";

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
import Settings from "./components/Settings";
import "./components/Theme.css";

const SETTINGS_KEY = "dociq.settings";

function getSavedTheme() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").theme || "system";
  } catch {
    return "system";
  }
}

function getCurrentPage() {
  const hash = window.location.hash;
  if (hash === "#login") return "login";
  if (hash === "#signup") return "signup";
  if (hash === "#dashboard") return "dashboard";
  if (hash === "#upload") return "upload";
  if (hash === "#documents") return "documents";
  if (hash.startsWith("#processing/")) return "processing";
  if (hash.startsWith("#reader/")) return "reader";
  if (hash.startsWith("#study/") || hash === "#study") return "study";
  if (hash === "#assistant") return "assistant";
  if (hash === "#settings") return "settings";
  return "home";
}

function App() {
  const [page, setPage] = useState(getCurrentPage);
  const [theme, setTheme] = useState(getSavedTheme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches || false);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const handleHashChange = () => setPage(getCurrentPage());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const update = (event) => setSystemDark(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.dociqTheme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const syncTheme = (event) => setTheme(event.detail || getSavedTheme());
    window.addEventListener("dociq-theme-change", syncTheme);
    return () => window.removeEventListener("dociq-theme-change", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...saved, theme: nextTheme }));
    } catch {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ theme: nextTheme }));
    }
    window.dispatchEvent(new CustomEvent("dociq-theme-change", { detail: nextTheme }));
  };

  const readerDocumentId = window.location.hash.startsWith("#reader/")
    ? window.location.hash.replace("#reader/", "")
    : null;

  return (
    <div className="dociq-app-root">
      {page === "home" && <Home />}
      {page === "login" && <Login />}
      {page === "signup" && <Signup />}
      {page === "dashboard" && <Dashboard />}
      {page === "upload" && <Upload />}
      {page === "documents" && <Documents />}
      {page === "processing" && <Processing />}
      {page === "reader" && <Reader documentId={readerDocumentId} />}
      {page === "study" && <StudyHub />}
      {page === "assistant" && <AIAssistant />}
      {page === "settings" && <Settings />}
      <button
        type="button"
        className="global-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
        title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
      >
        <span className="global-theme-toggle-icon" aria-hidden="true">{resolvedTheme === "dark" ? "☀" : "☾"}</span>
        <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
    </div>
  );
}

export default App;
