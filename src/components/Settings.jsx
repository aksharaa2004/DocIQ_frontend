import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import "./Settings.css";

const SETTINGS_KEY = "dociq.settings";
const DEFAULT_SETTINGS = {
  theme: "system",
  readingWidth: "comfortable",
  paragraphSpacing: "normal",
  highContrast: false,
  textSize: "normal",
  zoom: 100,
  comfortableReading: true,
  voiceEnabled: true,
  speechSpeed: 1,
  voiceURI: "",
  applicationLanguage: "en",
  translationLanguage: "en",
  documentSort: "recent",
  documentView: "list",
  confirmDelete: true,
  notifications: {
    documentProcessing: true,
    aiGeneration: true,
    studyMode: false,
    general: true,
  },
};

const LANGUAGES = [
  ["en", "English"], ["hi", "Hindi"], ["es", "Spanish"],
  ["fr", "French"], ["de", "German"], ["pt", "Portuguese"],
  ["ja", "Japanese"], ["zh", "Chinese"], ["ar", "Arabic"],
];

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
    };
  } catch {
    return { ...DEFAULT_SETTINGS, notifications: { ...DEFAULT_SETTINGS.notifications } };
  }
}

function readRecentDocuments() {
  try {
    const value = JSON.parse(localStorage.getItem("recentDocuments") || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("userName") || "Student");
  const [profileMessage, setProfileMessage] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [passwordFields, setPasswordFields] = useState({ current: "", next: "", confirm: "" });
  const [voiceList, setVoiceList] = useState([]);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches || false);
  const [modal, setModal] = useState("");
  const [deleteAcknowledged, setDeleteAcknowledged] = useState(false);
  const recentDocuments = readRecentDocuments();
  const storageBytes = recentDocuments.reduce((total, file) => total + (Number(file.size) || 0), 0);
  const browserStorageBytes = useMemo(() => {
    let total = 0;
    for (const key of Object.keys(localStorage)) total += key.length + (localStorage.getItem(key)?.length || 0);
    return total * 2;
  }, []);
  const resolvedTheme = settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("dociq-theme-change", { detail: settings.theme }));
  }, [settings.theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.detail) {
        setSettings((current) => current.theme === event.detail ? current : { ...current, theme: event.detail });
      }
    };
    window.addEventListener("dociq-theme-change", syncTheme);
    return () => window.removeEventListener("dociq-theme-change", syncTheme);
  }, [settings.theme]);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return undefined;
    const update = (event) => setSystemDark(event.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;
    const refreshVoices = () => setVoiceList(window.speechSynthesis.getVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", refreshVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const updateSetting = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const updateNotification = (key, value) => setSettings((current) => ({
    ...current,
    notifications: { ...current.notifications, [key]: value },
  }));

  const saveProfile = (event) => {
    event.preventDefault();
    const name = displayName.trim() || "Student";
    localStorage.setItem("userName", name);
    setDisplayName(name);
    setProfileMessage("Display name saved on this device.");
  };

  const testVoice = () => {
    if (!("speechSynthesis" in window)) {
      setVoiceMessage("Voice playback is not supported by this browser.");
      return;
    }
    if (!settings.voiceEnabled) {
      setVoiceMessage("Turn on voice playback to test a voice.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hello! This is a preview of your DocIQ reading voice.");
    utterance.rate = Number(settings.speechSpeed);
    const voice = voiceList.find((item) => item.voiceURI === settings.voiceURI);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    setVoiceMessage("");
  };

  const clearPreferences = () => {
    localStorage.removeItem(SETTINGS_KEY);
    setSettings({ ...DEFAULT_SETTINGS, notifications: { ...DEFAULT_SETTINGS.notifications } });
    setModal("");
  };

  const handleDeleteAccount = () => setDeleteAcknowledged(true);

  const navigateTo = (path) => { window.location.hash = path; };

  return (
    <div
      className={`dashboard-page settings-page ${settings.highContrast ? "settings-high-contrast" : ""} ${settings.comfortableReading ? "settings-comfortable" : ""}`}
      data-theme={resolvedTheme}
      data-text-size={settings.textSize}
      data-reading-width={settings.readingWidth}
      data-paragraph-spacing={settings.paragraphSpacing}
      style={{ "--settings-zoom": `${settings.zoom}%` }}
    >
      <aside className="dashboard-sidebar">
        <a href="#dashboard" className="dashboard-logo"><span className="dashboard-logo-icon">✦</span><span>DocIQ</span></a>
        <div className="dashboard-menu-title">MAIN MENU</div>
        <nav className="dashboard-menu">
          <a href="#dashboard" className="dashboard-menu-item"><span>🏠</span>Dashboard</a>
          <a href="#documents" className="dashboard-menu-item"><span>📄</span>My Documents</a>
          <a href="#upload" className="dashboard-menu-item"><span>📤</span>Upload Document</a>
          <a href="#study" className="dashboard-menu-item"><span>🎓</span>Study Hub</a>
          <a href="#assistant" className="dashboard-menu-item"><span>🤖</span>AI Assistant</a>
          <a href="#settings" className="dashboard-menu-item active" aria-current="page"><span>⚙️</span>Settings</a>
        </nav>
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-help-card"><div className="dashboard-help-icon">?</div><strong>Need help?</strong><p>Explore DocIQ and learn smarter.</p><button type="button" onClick={() => navigateTo("study")}>Explore Study Hub →</button></div>
          <button className="dashboard-logout" type="button" onClick={() => navigateTo("login")}><span>↪</span>Logout</button>
        </div>
      </aside>

      <main className="settings-main">
        <header className="settings-topbar">
          <div><p className="settings-eyebrow">PREFERENCES</p><h1>Settings</h1></div>
          <div className="settings-user"><span className="settings-avatar">{displayName.charAt(0).toUpperCase()}</span><span>{displayName}</span></div>
        </header>

        <div className="settings-content" id="settings-content">
          <div className="settings-intro"><div><h2>Make DocIQ yours</h2><p>Manage your account, reading experience, and preferences.</p></div><span className="settings-intro-icon">⚙</span></div>

          <section className="settings-section" id="account">
            <div className="settings-section-heading"><span className="settings-section-icon coral">♙</span><div><h2>Account</h2><p>Your profile and sign-in details.</p></div></div>
            <div className="settings-card-grid">
              <article className="settings-card">
                <h3>Profile</h3><p className="settings-card-description">Update the name shown in DocIQ.</p>
                <form className="settings-form" onSubmit={saveProfile}>
                  <label htmlFor="profile-name">Display name</label>
                  <input id="profile-name" value={displayName} maxLength={80} onChange={(event) => { setDisplayName(event.target.value); setProfileMessage(""); }} />
                  <button className="settings-button" type="submit">Save name</button>
                  {profileMessage && <span className="settings-inline-success" role="status">{profileMessage}</span>}
                </form>
                <p className="settings-note">Saved locally on this device; account profile sync needs a backend API.</p>
              </article>
              <article className="settings-card">
                <h3>Change Password</h3><p className="settings-card-description">Password updates require a secure account service.</p>
                <div className="settings-form">
                  <label htmlFor="current-password">Current password</label>
                  <input id="current-password" type="password" autoComplete="current-password" value={passwordFields.current} onChange={(event) => setPasswordFields((value) => ({ ...value, current: event.target.value }))} />
                  <label htmlFor="new-password">New password</label>
                  <input id="new-password" type="password" autoComplete="new-password" value={passwordFields.next} onChange={(event) => setPasswordFields((value) => ({ ...value, next: event.target.value }))} />
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" value={passwordFields.confirm} onChange={(event) => setPasswordFields((value) => ({ ...value, confirm: event.target.value }))} />
                  <button className="settings-button secondary" type="button" onClick={() => setAccountMessage("Password change is ready for the account API; no password was changed.")}>Change password</button>
                </div>
              </article>
            </div>
            {accountMessage && <p className="settings-callout" role="status">{accountMessage}</p>}
          </section>

          <section className="settings-section" id="appearance">
            <div className="settings-section-heading"><span className="settings-section-icon purple">◐</span><div><h2>Appearance</h2><p>Choose how DocIQ looks and feels while you study.</p></div></div>
            <div className="settings-card-grid">
              <article className="settings-card">
                <h3>Theme</h3><p className="settings-card-description">System follows your device appearance.</p>
                <div className="settings-segmented" role="group" aria-label="Theme">
                  {["light", "dark", "system"].map((theme) => <button key={theme} type="button" className={settings.theme === theme ? "selected" : ""} onClick={() => updateSetting("theme", theme)}>{theme[0].toUpperCase() + theme.slice(1)}</button>)}
                </div>
              </article>
              <article className="settings-card">
                <h3>Reading Preferences</h3>
                <div className="settings-field-row"><label htmlFor="reading-width">Reading width</label><select id="reading-width" value={settings.readingWidth} onChange={(event) => updateSetting("readingWidth", event.target.value)}><option value="comfortable">Comfortable</option><option value="wide">Wide</option></select></div>
                <div className="settings-field-row"><label htmlFor="paragraph-spacing">Paragraph spacing</label><select id="paragraph-spacing" value={settings.paragraphSpacing} onChange={(event) => updateSetting("paragraphSpacing", event.target.value)}><option value="compact">Compact</option><option value="normal">Normal</option><option value="relaxed">Relaxed</option></select></div>
              </article>
            </div>
            <article className="settings-card settings-accessibility-card">
              <h3>Accessibility</h3><p className="settings-card-description">Adjust contrast, text, and spacing for comfortable reading.</p>
              <div className="settings-options-grid">
                <label className="settings-toggle-row"><span><strong>High contrast</strong><small>Increase text and control contrast.</small></span><input type="checkbox" checked={settings.highContrast} onChange={(event) => updateSetting("highContrast", event.target.checked)} /></label>
                <div className="settings-field-row"><label htmlFor="text-size">Text size</label><select id="text-size" value={settings.textSize} onChange={(event) => updateSetting("textSize", event.target.value)}><option value="small">Small</option><option value="normal">Default</option><option value="large">Large</option><option value="extra-large">Extra large</option></select></div>
                <label className="settings-range-row" htmlFor="page-zoom"><span><strong>Zoom</strong><small>{settings.zoom}%</small></span><input id="page-zoom" type="range" min="80" max="125" step="5" value={settings.zoom} onChange={(event) => updateSetting("zoom", Number(event.target.value))} /></label>
                <label className="settings-toggle-row"><span><strong>Comfortable reading mode</strong><small>Use a softer background and roomier line spacing.</small></span><input type="checkbox" checked={settings.comfortableReading} onChange={(event) => updateSetting("comfortableReading", event.target.checked)} /></label>
              </div>
            </article>
          </section>

          <section className="settings-section" id="audio-language">
            <div className="settings-section-heading"><span className="settings-section-icon peach">♫</span><div><h2>Audio &amp; Language</h2><p>Set up spoken reading and language preferences.</p></div></div>
            <div className="settings-card-grid">
              <article className="settings-card">
                <h3>Voice Settings</h3>
                <label className="settings-toggle-row"><span><strong>Enable voice playback</strong><small>Use your browser’s speech synthesis.</small></span><input type="checkbox" checked={settings.voiceEnabled} onChange={(event) => updateSetting("voiceEnabled", event.target.checked)} /></label>
                <div className="settings-field-row"><label htmlFor="speech-speed">Speech speed</label><span className="settings-range-value">{Number(settings.speechSpeed).toFixed(1)}×</span></div>
                <input className="settings-full-range" id="speech-speed" type="range" min="0.5" max="2" step="0.1" value={settings.speechSpeed} onChange={(event) => updateSetting("speechSpeed", Number(event.target.value))} />
                <div className="settings-field-row"><label htmlFor="voice-choice">Voice</label><select id="voice-choice" value={settings.voiceURI} onChange={(event) => updateSetting("voiceURI", event.target.value)} disabled={!voiceList.length}><option value="">System default</option>{voiceList.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}</select></div>
                <button className="settings-button" type="button" onClick={testVoice} disabled={!settings.voiceEnabled}>▶ Test voice</button>
                {!voiceList.length && <p className="settings-note">Available voices depend on your browser and operating system.</p>}
              </article>
              <article className="settings-card">
                <h3>Language</h3><p className="settings-card-description">Preferences are saved locally. App-wide translations depend on language support.</p>
                <div className="settings-field-row"><label htmlFor="app-language">Application language</label><select id="app-language" value={settings.applicationLanguage} onChange={(event) => updateSetting("applicationLanguage", event.target.value)}>{LANGUAGES.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></div>
                <div className="settings-field-row"><label htmlFor="translation-language">Translation language</label><select id="translation-language" value={settings.translationLanguage} onChange={(event) => updateSetting("translationLanguage", event.target.value)}>{LANGUAGES.map(([code, name]) => <option value={code} key={code}>{name}</option>)}</select></div>
              </article>
            </div>
            {voiceMessage && <p className="settings-callout" role="status">{voiceMessage}</p>}
          </section>

          <section className="settings-section" id="documents-settings">
            <div className="settings-section-heading"><span className="settings-section-icon purple">▤</span><div><h2>Documents</h2><p>Choose how your document library is organized.</p></div></div>
            <div className="settings-card-grid">
              <article className="settings-card">
                <h3>Library Preferences</h3>
                <div className="settings-field-row"><label htmlFor="document-sort">Default sorting</label><select id="document-sort" value={settings.documentSort} onChange={(event) => updateSetting("documentSort", event.target.value)}><option value="recent">Recently added</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option><option value="size-desc">Largest first</option></select></div>
                <fieldset className="settings-view-choice"><legend>Default view</legend><label><input type="radio" name="document-view" value="list" checked={settings.documentView === "list"} onChange={() => updateSetting("documentView", "list")} /> List</label><label><input type="radio" name="document-view" value="grid" checked={settings.documentView === "grid"} onChange={() => updateSetting("documentView", "grid")} /> Grid</label></fieldset>
                <label className="settings-toggle-row"><span><strong>Confirm before deleting</strong><small>Ask before removing a document.</small></span><input type="checkbox" checked={settings.confirmDelete} onChange={(event) => updateSetting("confirmDelete", event.target.checked)} /></label>
              </article>
              <article className="settings-card">
                <h3>Storage Information</h3><p className="settings-card-description">Based on document details saved in this browser.</p>
                <div className="settings-storage-summary"><div><strong>{recentDocuments.length}</strong><span>Recent documents</span></div><div><strong>{formatBytes(storageBytes)}</strong><span>Document sizes</span></div><div><strong>{formatBytes(browserStorageBytes)}</strong><span>Local browser data</span></div></div>
                <p className="settings-note">This estimate does not include files stored on the server or cloud storage.</p>
              </article>
            </div>
          </section>

          <section className="settings-section" id="notifications">
            <div className="settings-section-heading"><span className="settings-section-icon coral">♧</span><div><h2>Notifications</h2><p>Choose which updates DocIQ may show you.</p></div></div>
            <article className="settings-card settings-notifications-card">
              {[["documentProcessing", "Document processing", "When a document finishes processing."], ["aiGeneration", "AI generation", "When notes or study content are ready."], ["studyMode", "Study Mode", "Study reminders and practice activity."], ["general", "General notifications", "Product tips and general updates."]].map(([key, title, description]) => (
                <label className="settings-toggle-row" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={settings.notifications[key]} onChange={(event) => updateNotification(key, event.target.checked)} /></label>
              ))}
              <p className="settings-note">Notification delivery is not connected yet; these preferences are saved locally.</p>
            </article>
          </section>

          <section className="settings-section" id="privacy">
            <div className="settings-section-heading"><span className="settings-section-icon peach">◇</span><div><h2>Privacy</h2><p>Review local data and account controls.</p></div></div>
            <div className="settings-card-grid">
              <article className="settings-card">
                <h3>Privacy &amp; Data</h3><p className="settings-card-description">DocIQ stores these preferences in this browser. Document content and account data may be stored by connected services.</p>
                <div className="settings-privacy-actions"><button className="settings-button secondary" type="button" onClick={() => setModal("clear")}>Clear local preferences</button><button className="settings-button danger" type="button" onClick={() => { setDeleteAcknowledged(false); setModal("delete"); }}>Delete Account</button></div>
              </article>
              <article className="settings-card settings-backend-note"><span className="settings-lock">⌑</span><div><h3>Account controls</h3><p className="settings-card-description">Password changes and account deletion need secure backend APIs. The controls here do not change server-side account data.</p></div></article>
            </div>
          </section>
        </div>
      </main>

      {modal && (
        <div className="settings-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(""); }}>
          <section className="settings-modal" role="alertdialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <span className={`settings-modal-icon ${modal === "delete" ? "danger" : ""}`}>{modal === "delete" ? "!" : "↻"}</span>
            <h2 id="settings-modal-title">{modal === "delete" ? "Delete your account?" : "Clear local preferences?"}</h2>
            {modal === "clear" ? (
              <><p>This clears DocIQ appearance, reading, voice, document, and notification preferences saved in this browser. It will not delete documents or your account.</p><div className="settings-modal-actions"><button className="settings-button secondary" type="button" onClick={() => setModal("")}>Cancel</button><button className="settings-button" type="button" onClick={clearPreferences}>Clear preferences</button></div></>
            ) : (
              <><p>Account deletion permanently removes server-side account data. This project does not have a delete-account API connected, so no account data can be deleted here.</p>{deleteAcknowledged && <p className="settings-callout" role="status">No data was deleted. Connect a secure account API to enable deletion.</p>}<div className="settings-modal-actions"><button className="settings-button secondary" type="button" onClick={() => setModal("")}>Cancel</button><button className="settings-button danger" type="button" onClick={handleDeleteAccount}>{deleteAcknowledged ? "Understood" : "Continue"}</button></div></>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Settings;
