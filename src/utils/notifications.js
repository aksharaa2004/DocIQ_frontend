const SETTINGS_KEY = "dociq.settings";
const DEFAULT_NOTIFICATIONS = {
  documentProcessing: true,
  aiGeneration: true,
  studyMode: false,
  general: true,
};

export function notifyDocIQ(category, title, message) {
  let enabled = DEFAULT_NOTIFICATIONS[category] !== false;
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    enabled = settings.notifications?.[category] ?? enabled;
  } catch {
    // Use the default enabled state if saved preferences cannot be read.
  }
  if (!enabled) return;

  window.dispatchEvent(new CustomEvent("dociq-notification", {
    detail: { category, title, message },
  }));
}
