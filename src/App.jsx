import { useEffect, useRef, useState } from "react";

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
import Admin from "./components/Admin";
import "./components/NotificationToast.css";
import "./components/Theme.css";

const SETTINGS_KEY = "dociq.settings";

function getSavedTheme() {
  try {
    return (
      JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}").theme ||
      "system"
    );
  } catch {
    return "system";
  }
}

function getCurrentPage() {
  const hash = window.location.hash.split("?")[0];

  if (hash === "#oauth-callback") return "oauth-callback";
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
  if (hash === "#admin") return "admin";

  return "home";
}

function getSignedInLandingPage() {
  return localStorage.getItem("userRole") === "admin"
    ? "admin"
    : "dashboard";
}

function replaceRoute(route) {
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}#${route}`,
  );
}

function App() {
  const [page, setPage] = useState(getCurrentPage);
  const [theme, setTheme] = useState(getSavedTheme);
  const [systemDark, setSystemDark] = useState(
    () =>
      window.matchMedia?.("(prefers-color-scheme: dark)").matches || false,
  );
  const [notification, setNotification] = useState(null);

  const notificationTimer = useRef(null);

  const resolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const syncPage = () => {
      const currentHash = window.location.hash;
      const hasSession = Boolean(localStorage.getItem("token"));
      const currentRole = localStorage.getItem("userRole");

      // Handle Google OAuth errors.
      if (currentHash.includes("error=google_failed")) {
        replaceRoute("login?error=google_failed");
        setPage("login");
        return;
      }

      // Handle Google OAuth callback.
      if (currentHash.startsWith("#oauth-callback")) {
        const queryString = currentHash.includes("?")
          ? currentHash.slice(currentHash.indexOf("?") + 1)
          : "";

        const params = new URLSearchParams(queryString);
        const token = params.get("token");

        if (params.get("error") === "google_failed" || !token) {
          replaceRoute("login?error=google_failed");
          setPage("login");
          return;
        }

        const name = params.get("name") || "";
        const email = params.get("email") || "";
        const role = params.get("role") || "user";

        localStorage.setItem("token", token);
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role);

        const landingPage = role === "admin" ? "admin" : "dashboard";

        replaceRoute(landingPage);
        setPage(landingPage);
        return;
      }

      const nextPage = getCurrentPage();

      const privatePages = new Set([
        "dashboard",
        "upload",
        "documents",
        "processing",
        "reader",
        "study",
        "assistant",
        "settings",
        "admin",
      ]);

      // Prevent access to protected pages without a session.
      if (privatePages.has(nextPage) && !hasSession) {
        replaceRoute("login");
        setPage("login");
        return;
      }

      // Only admins can access the admin dashboard.
      if (nextPage === "admin" && currentRole !== "admin") {
        replaceRoute("dashboard");
        setPage("dashboard");
        return;
      }

      // Prevent admins from returning to the user dashboard.
      if (nextPage === "dashboard" && currentRole === "admin") {
        replaceRoute("admin");
        setPage("admin");
        return;
      }

      // Keep admins in the admin area when navigating to user-only pages.
      const userOnlyPages = new Set([
        "upload",
        "documents",
        "processing",
        "reader",
        "study",
        "assistant",
        "settings",
      ]);

      if (userOnlyPages.has(nextPage) && currentRole === "admin") {
        replaceRoute("admin");
        setPage("admin");
        return;
      }

      // Redirect signed-in users away from public pages.
      if (
        ["home", "login", "signup"].includes(nextPage) &&
        hasSession
      ) {
        const landingPage = getSignedInLandingPage();

        replaceRoute(landingPage);
        setPage(landingPage);
        return;
      }

      setPage(nextPage);
    };

    syncPage();

    window.addEventListener("hashchange", syncPage);
    window.addEventListener("popstate", syncPage);

    return () => {
      window.removeEventListener("hashchange", syncPage);
      window.removeEventListener("popstate", syncPage);
    };
  }, []);

  // Follow system light/dark preference.
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");

    if (!media) return undefined;

    const update = (event) => setSystemDark(event.matches);

    media.addEventListener?.("change", update);

    return () => media.removeEventListener?.("change", update);
  }, []);

  // Apply the selected theme.
  useEffect(() => {
    document.documentElement.dataset.dociqTheme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Listen for theme changes from other components.
  useEffect(() => {
    const syncTheme = (event) => {
      setTheme(event.detail || getSavedTheme());
    };

    window.addEventListener("dociq-theme-change", syncTheme);

    return () => {
      window.removeEventListener("dociq-theme-change", syncTheme);
    };
  }, []);

  // Global notification handling.
  useEffect(() => {
    const showNotification = (event) => {
      setNotification({
        ...event.detail,
        id: Date.now(),
      });

      window.clearTimeout(notificationTimer.current);

      notificationTimer.current = window.setTimeout(() => {
        setNotification(null);
      }, 6000);
    };

    window.addEventListener("dociq-notification", showNotification);

    return () => {
      window.removeEventListener("dociq-notification", showNotification);
      window.clearTimeout(notificationTimer.current);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    setTheme(nextTheme);

    try {
      const saved = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}",
      );

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          ...saved,
          theme: nextTheme,
        }),
      );
    } catch {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: nextTheme }),
      );
    }

    window.dispatchEvent(
      new CustomEvent("dociq-theme-change", {
        detail: nextTheme,
      }),
    );
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
      {page === "admin" && <Admin />}

      {notification && (
        <div
          className="dociq-notification"
          role="status"
          aria-live="polite"
          key={notification.id}
        >
          <span
            className="dociq-notification-icon"
            aria-hidden="true"
          >
            ✓
          </span>

          <div className="dociq-notification-copy">
            <strong>{notification.title}</strong>
            <p>{notification.message}</p>
          </div>

          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        className="global-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${
          resolvedTheme === "dark" ? "light" : "dark"
        } mode`}
        title={`Switch to ${
          resolvedTheme === "dark" ? "light" : "dark"
        } mode`}
      >
        <span
          className="global-theme-toggle-icon"
          aria-hidden="true"
        >
          {resolvedTheme === "dark" ? "☀" : "☾"}
        </span>

        <span>
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </span>
      </button>
    </div>
  );
}

export default App;