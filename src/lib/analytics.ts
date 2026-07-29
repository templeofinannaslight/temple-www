const UMAMI_URL = (import.meta.env.VITE_UMAMI_URL || "").replace(/\/$/, "");
const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID || "";

// Posts a single event directly to Umami's public /api/send endpoint.
// Uses the public website ID only — no secret key. Umami infers pageview
// vs. custom event from the presence of `name` in the payload.
function send(fields: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) return; // no-op if unconfigured (e.g. some dev envs)

  const body = JSON.stringify({
    type: "event",
    payload: {
      website: UMAMI_WEBSITE_ID,
      hostname: window.location.hostname,
      ...fields,
    },
  });

  const endpoint = `${UMAMI_URL}/api/send`;

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function basePayload() {
  return {
    url: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    title: document.title,
    language: navigator.language || "",
    screen: `${window.screen.width}x${window.screen.height}`,
  };
}

export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  send({ ...basePayload(), name, ...(data ? { data } : {}) });
}

export function trackPageview() {
  if (typeof window === "undefined") return;
  send(basePayload());
}
