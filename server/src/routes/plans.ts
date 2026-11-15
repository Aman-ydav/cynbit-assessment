import {
  createPlanRequestSchema,
  encodeAnswers,
  generatePlan,
  planFromCode,
  type CreatePlanRequest,
} from "@bitelevate/shared";
import { Router } from "express";
import { HttpError } from "../middleware/errors";
import { createLimiter, type RateLimits } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { anonymousSessionId, recordEvent, recordPlan } from "../services/records";

export function plansRouter(limits: RateLimits): Router {
  const router = Router();

  /** Validate the answers, generate the plan and record anonymous analytics. */
  router.post(
    "/",
    createLimiter(limits.plans),
    validateBody(createPlanRequestSchema),
    async (req, res) => {
      const { answers, sessionId } = req.body as CreatePlanRequest;
      const plan = generatePlan(answers);
      const code = encodeAnswers(answers);
      const session = sessionId ?? anonymousSessionId();

      await Promise.all([
        recordPlan(plan, code, session),
        recordEvent("plan_generated", session, {
          lab: plan.primary.labId,
          match: plan.primary.matchPct,
          unmatched: plan.unmatched.length,
        }),
      ]);

      res.status(201).json({ code, plan });
    },
  );

  /** Re-create a plan from a share code. Stateless: no database read, so links never expire. */
  router.get("/:code", (req, res) => {
    const plan = planFromCode(req.params.code);
    if (!plan) throw new HttpError(404, "invalid_plan_code", "This plan link is not valid.");
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ code: encodeAnswers(plan.answers), plan });
  });

  return router;
}
