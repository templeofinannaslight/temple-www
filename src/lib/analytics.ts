function sendToServer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/track", blob);
    return;
  }

  fetch("/api/track", {
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
  sendToServer({ ...basePayload(), name, data });
}

export function trackPageview() {
  if (typeof window === "undefined") return;
  sendToServer(basePayload());
}
