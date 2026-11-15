import { LABS, matchLabel, planFromCode } from "@bitelevate/shared";
import { Router, type Request } from "express";
import type { Config } from "./config";

/**
 * Per-route <head> metadata, injected into the HTML shell on the server.
 *
 * A single-page app renders its tags in the browser, but link-preview crawlers (WhatsApp,
 * LinkedIn, Slack, search engines) don't run JavaScript. Injecting the tags server-side is what
 * makes a shared plan link show "Full Stack SaaS Lab — Strong match" with a proper image.
 */
export interface PageMeta {
  title: string;
  description: string;
  path: string;
  /** HTTP status for this route: unknown paths and invalid plan links are real 404s. */
  status: 200 | 404;
  noindex?: boolean;
}

export const SITE_NAME = "BitElevate Path Generator";
const DEFAULT_TITLE = `${SITE_NAME} — your personalised 60-day plan`;
const DEFAULT_DESCRIPTION =
  "Answer five quick questions and get an instant, explainable 60-day plan for the BitElevate remote engineering internship — matched to your level, goal and time.";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Absolute base URL for links in tags. Prefer the configured public URL over the Host header. */
export function resolveOrigin(config: Pick<Config, "publicUrl">, req: Request): string {
  return config.publicUrl ?? `${req.protocol}://${req.get("host") ?? "localhost"}`;
}

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
};

export function metaForPath(pathname: string): PageMeta {
  const path = pathname.replace(/\/+$/, "") || "/";

  const planMatch = /^\/plan\/([^/]+)$/.exec(path);
  if (planMatch) {
    const plan = planFromCode(safeDecode(planMatch[1] ?? ""));
    if (!plan) {
      return {
        title: `Plan link not valid · ${SITE_NAME}`,
        description: DEFAULT_DESCRIPTION,
        path,
        status: 404,
        noindex: true,
      };
    }
    const lab = LABS[plan.primary.labId];
    const pct = plan.primary.matchPct;
    return {
      title: `My BitElevate plan: ${lab.name} · ${SITE_NAME}`,
      description: `${matchLabel(pct)} (${pct}%) for the ${lab.name}. ${plan.primary.reasons[0] ?? ""} See the personalised 60-day roadmap, readiness check and prep plan.`.replace(/\s+/g, " "),
      path,
      status: 200,
      // Shared plans are for the people they're shared with, not for search results.
      noindex: true,
    };
  }

  switch (path) {
    case "/":
      return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path, status: 200 };
    case "/path":
      return {
        title: `Build your plan · ${SITE_NAME}`,
        description: DEFAULT_DESCRIPTION,
        path,
        status: 200,
      };
    case "/privacy":
      return {
        title: `Privacy · ${SITE_NAME}`,
        description: "What the BitElevate Path Generator collects, what it doesn't, and how to delete your details.",
        path,
        status: 200,
      };
    case "/admin":
      return { title: `Admin · ${SITE_NAME}`, description: DEFAULT_DESCRIPTION, path, status: 200, noindex: true };
    default:
      return {
        title: `Page not found · ${SITE_NAME}`,
        description: DEFAULT_DESCRIPTION,
        path,
        status: 404,
        noindex: true,
      };
  }
}

export function metaTags(origin: string, meta: PageMeta): string {
  const e = escapeHtml;
  const url = `${origin}${meta.path === "/" ? "" : meta.path}`;
  const image = `${origin}/og.png`;
  const alt = "A sample personalised BitElevate plan: recommended lab, match strength and 60-day roadmap";

  const tags = [
    `<meta name="description" content="${e(meta.description)}" />`,
    meta.noindex
      ? `<meta name="robots" content="noindex, nofollow" />`
      : `<link rel="canonical" href="${e(url)}" />`,
    `<meta property="og:site_name" content="${e(SITE_NAME)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${e(meta.title)}" />`,
    `<meta property="og:description" content="${e(meta.description)}" />`,
    `<meta property="og:url" content="${e(url)}" />`,
    `<meta property="og:image" content="${e(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${e(alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${e(meta.title)}" />`,
    `<meta name="twitter:description" content="${e(meta.description)}" />`,
    `<meta name="twitter:image" content="${e(image)}" />`,
  ];
  return tags.map((tag) => `    ${tag}`).join("\n");
}

/**
 * Replace the shell's title/description and add the route's tags just before </head>.
 * `extraHead` carries resource hints (preloads) that are built elsewhere and already escaped.
 */
export function injectMeta(html: string, origin: string, meta: PageMeta, extraHead = ""): string {
  // A template without a <head> can't be safely rewritten; serve it untouched rather than break it.
  if (!/<\/head>/i.test(html)) return html;
  const hints = extraHead ? `\n${extraHead}` : "";
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/i, "")
    .replace(
      /<\/head>/i,
      () => `    <title>${escapeHtml(meta.title)}</title>\n${metaTags(origin, meta)}${hints}\n  </head>`,
    );
}

/** robots.txt and sitemap.xml, built from the configured public URL. */
export function seoRouter(config: Pick<Config, "publicUrl">): Router {
  const router = Router();

  router.get("/robots.txt", (req, res) => {
    res.type("text/plain").send(
      [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin",
        "Disallow: /api/",
        "",
        `Sitemap: ${resolveOrigin(config, req)}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  router.get("/sitemap.xml", (req, res) => {
    const origin = resolveOrigin(config, req);
    const urls = ["/", "/path", "/privacy"]
      .map((path) => `  <url><loc>${escapeHtml(origin + (path === "/" ? "" : path))}</loc></url>`)
      .join("\n");
    res
      .type("application/xml")
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  });

  return router;
}
