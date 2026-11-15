import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { serveClient } from "./client-static";
import type { Config } from "./config";
import { log } from "./logger";
import { apiNotFound, errorHandler } from "./middleware/errors";
import { apiRouter } from "./routes";

const GA_HOSTS = ["https://www.googletagmanager.com", "https://www.google-analytics.com"];

/** Builds the Express app. Kept separate from `listen()` so tests can drive it with supertest. */
export function createApp(config: Config): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://www.googletagmanager.com"],
          connectSrc: ["'self'", ...GA_HOSTS, "https://*.analytics.google.com"],
          imgSrc: ["'self'", "data:", ...GA_HOSTS],
          // Radix/shadcn components set inline style attributes for positioning.
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          ...(config.isProd ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  if (config.clientOrigin) {
    app.use("/api", cors({ origin: config.clientOrigin, credentials: true }));
  }

  if (config.env !== "test") {
    app.use((req, res, next) => {
      const started = Date.now();
      res.on("finish", () => {
        if (req.path === "/api/health") return;
        log.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
      });
      next();
    });
  }

  app.use(express.json({ limit: "10kb" }));
  app.use(cookieParser());

  // The API is never indexed; the SPA shell is served below for everything else.
  app.use("/api", (_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  app.use("/api", apiRouter(config));
  app.use("/api", apiNotFound);

  serveClient(app, config.clientDist);

  app.use(errorHandler);
  return app;
}
