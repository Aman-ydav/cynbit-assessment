import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { Config } from "../config";

export const ADMIN_COOKIE = "admin_session";
export const SESSION_HOURS = 8;

/**
 * Constant-time comparison. Both sides are hashed first so the inputs always have equal length
 * (timingSafeEqual requires that) and no length information leaks through timing.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function signAdminToken(config: Pick<Config, "adminJwtSecret">): string {
  return jwt.sign({ role: "admin" }, config.adminJwtSecret, {
    algorithm: "HS256",
    expiresIn: `${SESSION_HOURS}h`,
  });
}

export function isValidAdminToken(
  token: unknown,
  config: Pick<Config, "adminJwtSecret">,
): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  try {
    // Pin the algorithm: otherwise a forged token using "alg: none" could be accepted.
    const payload = jwt.verify(token, config.adminJwtSecret, { algorithms: ["HS256"] });
    return typeof payload === "object" && payload.role === "admin";
  } catch {
    return false;
  }
}

export function cookieOptions(config: Pick<Config, "isProd">) {
  return {
    httpOnly: true, // not readable by page scripts, so XSS cannot steal the session
    sameSite: "lax" as const, // not sent on cross-site POSTs (CSRF defence)
    secure: config.isProd,
    path: "/api/admin",
  };
}

/** Rejects requests that do not carry a valid admin session cookie. */
export function requireAdmin(config: Pick<Config, "adminJwtSecret">): RequestHandler {
  return (req, res, next) => {
    if (isValidAdminToken(req.cookies?.[ADMIN_COOKIE], config)) return next();
    res.status(401).json({ error: "unauthorized" });
  };
}
