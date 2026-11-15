import { Router } from "express";
import mongoose from "mongoose";
import type { Config } from "../config";
import { DEFAULT_LIMITS, type RateLimits } from "../middleware/rateLimit";
import { eventsRouter } from "./events";
import { leadsRouter } from "./leads";
import { plansRouter } from "./plans";

export interface ApiOptions {
  /** Override rate limits (used by tests). */
  limits?: Partial<RateLimits>;
}

export function apiRouter(config: Config, options: ApiOptions = {}): Router {
  const limits: RateLimits = { ...DEFAULT_LIMITS, ...options.limits };
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  /** Lets the client hide options the server cannot honour (e.g. emailing a plan). */
  router.get("/config", (_req, res) => {
    res.json({ emailEnabled: Boolean(config.email) });
  });

  router.use("/plans", plansRouter(limits));
  router.use("/leads", leadsRouter(config, limits));
  router.use("/events", eventsRouter(limits));

  return router;
}
