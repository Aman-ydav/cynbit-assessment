import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { log } from "../logger";

/** An error that maps directly to an HTTP response. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "not_found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.code, message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "validation_error",
      issues: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
    return;
  }
  // Errors raised by express.json()
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "invalid_json" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "payload_too_large" });
    return;
  }

  log.error("Unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
};
