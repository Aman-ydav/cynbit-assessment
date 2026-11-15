import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import { log } from "./logger";

/**
 * Serve the built React app from the same origin as the API, with an SPA fallback so deep links
 * (e.g. /plan/abc) load index.html. Hashed assets are cached for a year; the HTML never is.
 */
export function serveClient(app: Express, distDir: string): boolean {
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

  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/")) return next();
    // A request for a file that does not exist (/missing.js) is a real 404, not the app shell.
    if (path.extname(req.path)) return next();

    res.setHeader("Cache-Control", "no-cache");
    if (req.path.startsWith("/admin")) res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.type("html").send(indexHtml);
  });

  return true;
}
