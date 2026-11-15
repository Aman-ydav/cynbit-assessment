import fs from "node:fs";
import path from "node:path";
import express, { type Express, type Request } from "express";
import { log } from "./logger";
import { createPreloader } from "./preload";
import { injectMeta, metaForPath } from "./seo";

/**
 * Serve the built React app from the same origin as the API, with an SPA fallback so deep links
 * (e.g. /plan/abc) load the app shell. Hashed assets are cached for a year; the HTML never is.
 * The shell gets route-specific <head> tags (see seo.ts) and real 404 statuses for unknown routes.
 */
export function serveClient(
  app: Express,
  distDir: string,
  originOf: (req: Request) => string,
): boolean {
  const indexPath = path.join(distDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    log.warn(`No client build at ${distDir} — serving the API only. Run "npm run build" first.`);
    return false;
  }

  app.use(
    express.static(distDir, {
      index: false,
      setHeaders(res, filePath) {
        const isHashedAsset = filePath.replace(/\\/g, "/").includes("/assets/");
        res.setHeader(
          "Cache-Control",
          isHashedAsset ? "public, max-age=31536000, immutable" : "public, max-age=3600",
        );
      },
    }),
  );

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const preloader = createPreloader(distDir, indexHtml);

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/")) return next();
    // A request for a file that does not exist (/missing.js) is a real 404, not the app shell.
    if (path.extname(req.path)) return next();

    const meta = metaForPath(req.path);
    res.setHeader("Cache-Control", "no-cache");
    if (meta.noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.status(meta.status).type("html").send(injectMeta(indexHtml, originOf(req), meta, preloader.headFor(req.path)));
  });

  return true;
}
