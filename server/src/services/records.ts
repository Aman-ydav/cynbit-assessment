import { createHash, randomBytes } from "node:crypto";
import type { EventName, Plan } from "@bitelevate/shared";
import { log } from "../logger";
import { EventModel } from "../models/Event";
import { LeadModel } from "../models/Lead";
import { PlanModel } from "../models/Plan";

type EventProps = Record<string, string | number | boolean>;

/**
 * Analytics writes are best-effort: a database hiccup must never break the learner's flow,
 * so failures are logged and swallowed.
 */
export async function recordEvent(name: EventName, sessionId: string, props?: EventProps) {
  try {
    await EventModel.create({ name, sessionId, props });
  } catch (error) {
    log.warn(`Could not record event ${name}:`, error instanceof Error ? error.message : error);
  }
}

export async function recordPlan(plan: Plan, code: string, sessionId: string) {
  try {
    const { answers } = plan;
    await PlanModel.create({
      code,
      sessionId,
      engineVersion: plan.engineVersion,
      primaryLab: plan.primary.labId,
      matchPct: plan.primary.matchPct,
      stage: answers.stage,
      experience: answers.experience,
      goal: answers.goal,
      hoursPerDay: answers.hoursPerDay,
      examsSoon: answers.examsSoon,
      interests: answers.interests,
      skills: answers.skills,
      unmatched: plan.unmatched.map((u) => u.id),
    });
  } catch (error) {
    log.warn("Could not record plan:", error instanceof Error ? error.message : error);
  }
}

/** A random id for server-side events when the caller did not supply a session. */
export const anonymousSessionId = () => `srv_${randomBytes(9).toString("base64url")}`;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export interface UpsertLeadInput {
  planCode: string;
  primaryLab: string;
  name: string;
  email: string;
  phone?: string;
  wantsEmail: boolean;
  wantsAdvisor: boolean;
}

/**
 * Creates the lead, or refreshes it if this email already asked about this plan. Returns the
 * raw delete token (shown once to the learner); only its hash is stored.
 */
export async function upsertLead(input: UpsertLeadInput) {
  const deleteToken = randomBytes(24).toString("base64url");
  const fields = {
    name: input.name,
    phone: input.phone || undefined,
    primaryLab: input.primaryLab,
    wantsEmail: input.wantsEmail,
    wantsAdvisor: input.wantsAdvisor,
    consentAt: new Date(),
    deleteTokenHash: hashToken(deleteToken),
  };
  const filter = { email: input.email.toLowerCase(), planCode: input.planCode };

  // Two simultaneous submissions can race on the unique index; the loser simply retries as an update.
  for (let attempt = 0; ; attempt++) {
    try {
      const lead = await LeadModel.findOneAndUpdate(
        filter,
        { $set: fields },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      return { lead, deleteToken };
    } catch (error) {
      const duplicate = (error as { code?: number }).code === 11000;
      if (!duplicate || attempt >= 1) throw error;
    }
  }
}

export async function deleteLeadByToken(token: string): Promise<boolean> {
  const result = await LeadModel.deleteMany({ deleteTokenHash: hashToken(token) });
  return result.deletedCount > 0;
}
