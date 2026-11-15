import { Router } from "express";
import mongoose from "mongoose";
import type { Config } from "../config";

export function apiRouter(_config: Config): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  return router;
}
