import { eventInputSchema, type EventInput } from "@bitelevate/shared";
import { Router } from "express";
import { createLimiter, type RateLimits } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { recordEvent } from "../services/records";

export function eventsRouter(limits: RateLimits): Router {
  const router = Router();

  /** Anonymous funnel events from the browser. Server-truth events cannot be sent from here. */
  router.post("/", createLimiter(limits.events), validateBody(eventInputSchema), async (req, res) => {
    const { sessionId, name, props } = req.body as EventInput;
    await recordEvent(name, sessionId, props);
    res.status(204).end();
  });

  return router;
}
