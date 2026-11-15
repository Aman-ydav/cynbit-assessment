import { rateLimit } from "express-rate-limit";

export interface LimitRule {
  windowMs: number;
  /** Max requests per IP within the window. */
  limit: number;
}

export interface RateLimits {
  plans: LimitRule;
  leads: LimitRule;
  events: LimitRule;
  adminLogin: LimitRule;
  admin: LimitRule;
}

/**
 * Per-IP limits. These use an in-memory store, which is correct for a single instance;
 * behind several instances, back them with a shared store (e.g. Redis) — see the README.
 */
export const DEFAULT_LIMITS: RateLimits = {
  plans: { windowMs: 10 * 60_000, limit: 40 },
  leads: { windowMs: 10 * 60_000, limit: 8 },
  events: { windowMs: 60_000, limit: 240 },
  adminLogin: { windowMs: 15 * 60_000, limit: 8 },
  admin: { windowMs: 60_000, limit: 120 },
};

export function createLimiter(rule: LimitRule) {
  return rateLimit({
    windowMs: rule.windowMs,
    limit: rule.limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "rate_limited", message: "Too many requests — please try again shortly." },
  });
}
