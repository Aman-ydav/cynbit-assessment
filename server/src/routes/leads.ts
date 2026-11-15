import { randomBytes } from "node:crypto";
import {
  LABS,
  decodeAnswers,
  encodeAnswers,
  generatePlan,
  leadInputSchema,
  type LeadInput,
} from "@bitelevate/shared";
import { Router, type RequestHandler } from "express";
import type { Config } from "../config";
import { HttpError } from "../middleware/errors";
import { createLimiter, type RateLimits } from "../middleware/rateLimit";
import { validateBody } from "../middleware/validate";
import { LeadModel } from "../models/Lead";
import { sendPlanEmail } from "../services/email";
import {
  anonymousSessionId,
  deleteLeadByToken,
  recordEvent,
  upsertLead,
} from "../services/records";

/**
 * Bots tend to fill every field. A hidden "website" input that real people never see is the
 * trap: if it has a value we answer with a convincing success but store nothing.
 */
const honeypot: RequestHandler = (req, res, next) => {
  const trap: unknown = req.body?.website;
  if (typeof trap === "string" && trap.length > 0) {
    res
      .status(201)
      .json({ ok: true, deleteToken: randomBytes(24).toString("base64url"), emailSent: false });
    return;
  }
  next();
};

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{20,64}$/;

export function leadsRouter(config: Config, limits: RateLimits): Router {
  const router = Router();

  /** Save a learner's request to be contacted. Only called after they have seen their plan. */
  router.post(
    "/",
    createLimiter(limits.leads),
    honeypot,
    validateBody(leadInputSchema),
    async (req, res) => {
      const input = req.body as LeadInput;

      const answers = decodeAnswers(input.planCode);
      if (!answers) throw new HttpError(400, "invalid_plan_code", "This plan link is not valid.");
      const plan = generatePlan(answers);
      const planCode = encodeAnswers(answers);

      const { lead, deleteToken } = await upsertLead({
        planCode,
        primaryLab: plan.primary.labId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        wantsEmail: input.wantsEmail,
        wantsAdvisor: input.wantsAdvisor,
      });

      // Only claim the email went out if the provider actually accepted it.
      let emailSent = false;
      if (input.wantsEmail && config.email && config.publicUrl) {
        emailSent = await sendPlanEmail(config, {
          to: input.email,
          name: input.name,
          planUrl: `${config.publicUrl}/plan/${planCode}`,
          labName: LABS[plan.primary.labId].name,
          matchPct: plan.primary.matchPct,
        });
        if (emailSent) await LeadModel.updateOne({ _id: lead._id }, { $set: { emailSentAt: new Date() } });
      }

      await recordEvent("lead_submitted", input.sessionId ?? anonymousSessionId(), {
        lab: plan.primary.labId,
        advisor: input.wantsAdvisor,
        email: input.wantsEmail,
      });

      res.status(201).json({ ok: true, deleteToken, emailSent });
    },
  );

  /** "Delete my data": the learner holds the secret token returned when they signed up. */
  router.delete("/:token", createLimiter(limits.leads), async (req, res) => {
    const { token } = req.params as { token: string };
    if (!TOKEN_FORMAT.test(token)) throw new HttpError(400, "invalid_token");
    const deleted = await deleteLeadByToken(token);
    if (!deleted) throw new HttpError(404, "not_found", "No matching record was found.");
    res.status(204).end();
  });

  return router;
}
