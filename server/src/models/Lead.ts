import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A learner who asked to hear from Cynbit after seeing their plan. Created only with explicit
 * consent. The delete token is stored as a hash, so a database leak cannot be used to erase
 * other people's records; the learner keeps the raw token and can delete their data with it.
 */
const leadSchema = new Schema(
  {
    planCode: { type: String, required: true },
    primaryLab: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 20 },
    wantsEmail: { type: Boolean, required: true },
    wantsAdvisor: { type: Boolean, required: true },
    consentAt: { type: Date, required: true },
    deleteTokenHash: { type: String, required: true, index: true },
    emailSentAt: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false },
);

// One lead per person per plan: resubmitting updates the existing record instead of duplicating it.
leadSchema.index({ email: 1, planCode: 1 }, { unique: true });

export type LeadDoc = InferSchemaType<typeof leadSchema>;
export const LeadModel = model("Lead", leadSchema);
