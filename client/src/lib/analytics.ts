import type { ClientEventName } from "@bitelevate/shared";

/**
 * Funnel analytics.
 *
 * Two sinks, both anonymous:
 *  1. our own API (`/api/events`) — the source of truth for the admin funnel;
 *  2. Google Analytics 4, only if VITE_GA_ID is configured.
 *
 * The session id is random, lives in sessionStorage (one per tab) and is not tied to a person,
 * cookie or device. Browsers that send Do Not Track are respected: nothing is sent at all.
 */
type Props = Record<string, string | number | boolean>;

const SESSION_KEY = "bitelevate.session";
const GA_ID: string | undefined = import.meta.env.VITE_GA_ID || undefined;

let memorySession: string | undefined;

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `s_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode, strict settings): fall back to a per-page-load id.
    return (memorySession ??= randomId());
  }
}

const trackingAllowed = () => navigator.doNotTrack !== "1";

type Gtag = (...args: unknown[]) => void;
const gtag = (): Gtag | undefined => (window as unknown as { gtag?: Gtag }).gtag;

/** Loads GA4 (if configured). Called once at startup; a no-op without VITE_GA_ID. */
export function initAnalytics() {
  if (!GA_ID || !trackingAllowed()) return;
  const w = window as unknown as { dataLayer: unknown[]; gtag: Gtag };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments);
  };
  w.gtag("js", new Date());
  // Page views are reported manually on route changes (this is a single-page app).
  w.gtag("config", GA_ID, { send_page_view: false, anonymize_ip: true });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

export function trackPageView(path: string) {
  if (!trackingAllowed()) return;
  gtag()?.("event", "page_view", { page_path: path, page_title: document.title });
}

export function track(name: ClientEventName, props?: Props) {
  if (!trackingAllowed()) return;

  const body = { sessionId: getSessionId(), name, props };
  const payload = JSON.stringify(body);
  try {
    // sendBeacon survives page unloads (e.g. clicking the external "Enrol" link).
    const queued =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    if (!queued) {
      void fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* analytics must never break the app */
  }

  gtag()?.("event", name, props);
}
