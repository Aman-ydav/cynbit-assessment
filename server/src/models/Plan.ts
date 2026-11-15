import { Schema, model, type InferSchemaType } from "mongoose";

const PLAN_RETENTION_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * One record per generated plan, kept for analytics (which labs get recommended, which
 * interests have no lab). Holds no personal data — only the anonymous quiz answers.
 */
const planSchema = new Schema(
  {
    code: { type: String, required: true, index: true },
    sessionId: { type: String },
    engineVersion: { type: Number, required: true },
    primaryLab: { type: String, required: true, index: true },
    matchPct: { type: Number, required: true },
    stage: { type: String, required: true },
    experience: { type: String, required: true },
    goal: { type: String, required: true },
    hoursPerDay: { type: String, required: true },
    examsSoon: { type: Boolean, required: true },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    /** Interests the learner picked that no lab covers — the demand signal for new labs. */
    unmatched: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now, index: true, expires: PLAN_RETENTION_SECONDS },
  },
  { versionKey: false },
);

export type PlanDoc = InferSchemaType<typeof planSchema>;
export const PlanModel = model("Plan", planSchema);
