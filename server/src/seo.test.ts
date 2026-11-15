import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { encodeAnswers, type Answers } from "@bitelevate/shared";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeConfig, relaxedLimits, useTestDb } from "../test/helpers";
import { createApp } from "./app";
import { escapeHtml, injectMeta, metaForPath } from "./seo";

useTestDb();

const TEMPLATE =
  '<!doctype html><html><head><meta charset="utf-8" /><title>old title</title>' +
  '<meta name="description" content="old description" /></head><body><div id="root"></div></body></html>';

const answers: Answers = {
  stage: "year3",
  experience: "basics",
  goal: "first_job",
  interests: ["backend_apis"],
  hoursPerDay: "h1_5_2",
  examsSoon: false,
  skills: ["git", "python"],
};
const validCode = encodeAnswers(answers);

let dist: string;
beforeAll(() => {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "seo-dist-"));
  fs.writeFileSync(path.join(dist, "index.html"), TEMPLATE);
});
afterAll(() => fs.rmSync(dist, { recursive: true, force: true }));

const app = (extra: Record<string, string> = {}) =>
  createApp(makeConfig({ CLIENT_DIST: dist, ...extra }), { limits: relaxedLimits });

const metaContent = (html: string, attr: string, name: string) =>
  new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`).exec(html)?.[1];

describe("link-preview tags for a shared plan", () => {
  it("names the recommended lab so WhatsApp/LinkedIn show a meaningful card", async () => {
    const res = await request(app()).get(`/plan/${validCode}`);
    expect(res.status).toBe(200);
    expect(metaContent(res.text, "property", "og:title")).toContain("Python Backend Lab");
    expect(metaContent(res.text, "property", "og:description")).toMatch(/Strong match \(\d+%\)/);
    expect(metaContent(res.text, "name", "twitter:card")).toBe("summary_large_image");
    expect(res.text).toContain("<title>My BitElevate plan: Python Backend Lab");
  });

  it("uses a PNG image with an absolute URL (SVG previews are not rendered by most platforms)", async () => {
    const res = await request(app()).get(`/plan/${validCode}`);
    const image = metaContent(res.text, "property", "og:image");
    expect(image).toMatch(/^https?:\/\/[^/]+\/og\.png$/);
    expect(metaContent(res.text, "property", "og:image:width")).toBe("1200");
    expect(metaContent(res.text, "property", "og:image:height")).toBe("630");
  });

  it("builds absolute URLs from PUBLIC_URL rather than the Host header when configured", async () => {
    const res = await request(app({ PUBLIC_URL: "https://paths.example.com" }))
      .get(`/plan/${validCode}`)
      .set("Host", "attacker.example");
    expect(metaContent(res.text, "property", "og:image")).toBe("https://paths.example.com/og.png");
    expect(metaContent(res.text, "property", "og:url")).toBe(`https://paths.example.com/plan/${validCode}`);
    expect(res.text).not.toContain("attacker.example");
  });

  it("keeps shared plans out of search results but still renders previews", async () => {
    const res = await request(app()).get(`/plan/${validCode}`);
    expect(res.text).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(res.headers["x-robots-tag"]).toMatch(/noindex/);
  });

  it("replaces the template's own title and description instead of duplicating them", async () => {
    const res = await request(app()).get(`/plan/${validCode}`);
    expect(res.text).not.toContain("old title");
    expect(res.text).not.toContain("old description");
    expect(res.text.match(/<title>/g)).toHaveLength(1);
    expect(res.text.match(/name="description"/g)).toHaveLength(1);
  });
});

describe("status codes and indexing", () => {
  it("returns a real 404 (not a soft 404) for an invalid plan link", async () => {
    const res = await request(app()).get("/plan/not-a-valid-code");
    expect(res.status).toBe(404);
    expect(res.text).toContain('content="noindex, nofollow"');
    expect(res.text).not.toContain("Python Backend Lab");
  });

  it("returns 404 for unknown routes but still serves the shell so the app can show its own page", async () => {
    const res = await request(app()).get("/definitely/not/a/page");
    expect(res.status).toBe(404);
    expect(res.text).toContain('<div id="root">');
  });

  it("serves indexable pages with a canonical URL", async () => {
    const res = await request(app({ PUBLIC_URL: "https://paths.example.com" })).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain('<link rel="canonical" href="https://paths.example.com" />');
    expect(res.text).not.toContain("noindex");
  });

  it("never lets /admin be indexed", async () => {
    const res = await request(app()).get("/admin");
    expect(res.status).toBe(200);
    expect(res.text).toContain("noindex");
  });
});

describe("robots.txt and sitemap.xml", () => {
  it("blocks the admin area and API, and points at the sitemap", async () => {
    const res = await request(app({ PUBLIC_URL: "https://paths.example.com" })).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.text).toContain("Disallow: /admin");
    expect(res.text).toContain("Disallow: /api/");
    expect(res.text).toContain("Sitemap: https://paths.example.com/sitemap.xml");
  });

  it("lists only public pages — never shared plans or the admin area", async () => {
    const res = await request(app({ PUBLIC_URL: "https://paths.example.com" })).get("/sitemap.xml");
    expect(res.headers["content-type"]).toContain("xml");
    expect(res.text).toContain("<loc>https://paths.example.com</loc>");
    expect(res.text).toContain("<loc>https://paths.example.com/path</loc>");
    expect(res.text).not.toContain("/plan/");
    expect(res.text).not.toContain("/admin");
  });
});

describe("metadata helpers", () => {
  it("escapes HTML in every injected value", () => {
    const html = injectMeta(TEMPLATE, 'https://x.example/"><script>alert(1)</script>', {
      title: '"><script>alert(2)</script>',
      description: "<img src=x onerror=alert(3)>",
      path: "/",
      status: 200,
    });
    expect(html).not.toMatch(/<script>alert/);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapeHtml handles all five special characters", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("leaves a template without a <head> untouched", () => {
    const html = "<html><body>no head</body></html>";
    expect(injectMeta(html, "https://x.example", metaForPath("/"))).toBe(html);
  });

  it("treats trailing slashes and malformed escapes safely", () => {
    expect(metaForPath("/privacy/").status).toBe(200);
    expect(metaForPath("/plan/%E0%A4%A").status).toBe(404); // invalid percent-encoding must not throw
  });
});
