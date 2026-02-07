const STORAGE_KEY = "ml_analytics_session_id";

type UiEventName =
  | "page_view"
  | "chat_open"
  | "chat_close"
  | "chat_submit"
  | "project_open"
  | "project_external_open"
  | "article_open"
  | "article_share"
  | "resume_export_click";

type TrackEventPayload = {
  name: UiEventName;
  path?: string;
  properties?: Record<string, unknown>;
};

const getSessionId = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(STORAGE_KEY, generated);
  return generated;
};

export const trackUiEvent = async ({
  name,
  path,
  properties,
}: TrackEventPayload): Promise<void> => {
  if (typeof window === "undefined") return;

  const payload = {
    name,
    path: path ?? `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || undefined,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
    properties,
  };

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
      return;
    }

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // Analytics calls must never break user flows.
  }
};
