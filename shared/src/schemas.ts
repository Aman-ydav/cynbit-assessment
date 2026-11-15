import { z } from "zod";
import { INTEREST_IDS, MAX_INTERESTS } from "./interests";
import { DAILY_HOURS, EXPERIENCE_LEVELS, GOALS, STAGES } from "./options";
import { SKILL_IDS } from "./skills";

const isUnique = <T>(items: readonly T[]) => new Set(items).size === items.length;

/** The learner's answers. Validated identically on the client and the server. */
export const answersSchema = z.object({
  stage: z.enum(STAGES),
  experience: z.enum(EXPERIENCE_LEVELS),
  goal: z.enum(GOALS),
  interests: z
    .array(z.enum(INTEREST_IDS))
    .max(MAX_INTERESTS, `Pick up to ${MAX_INTERESTS} interests`)
    .refine(isUnique, "Interests must be unique"),
  hoursPerDay: z.enum(DAILY_HOURS),
  examsSoon: z.boolean(),
  skills: z.array(z.enum(SKILL_IDS)).refine(isUnique, "Skills must be unique"),
});

export type Answers = z.infer<typeof answersSchema>;

/** Random per-tab id generated in the browser; links events together without identifying anyone. */
export const sessionIdSchema = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

/** Body of POST /api/plans. */
export const createPlanRequestSchema = z.object({
  answers: answersSchema,
  sessionId: sessionIdSchema.optional(),
});

export type CreatePlanRequest = z.infer<typeof createPlanRequestSchema>;

/** Optional contact details collected only after the learner has seen their plan. */
export const leadInputSchema = z
  .object({
    planCode: z.string().min(1).max(200),
    name: z.string().trim().min(2, "Enter your name").max(80),
    email: z.email("Enter a valid email address").max(120),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    wantsEmail: z.boolean(),
    wantsAdvisor: z.boolean(),
    consent: z.literal(true, { error: "Please agree so we can contact you" }),
    sessionId: sessionIdSchema.optional(),
    /** Honeypot: real people never see or fill this field. */
    website: z.string().max(0).optional(),
  })
  .refine((lead) => lead.wantsEmail || lead.wantsAdvisor, {
    message: "Choose how you'd like to hear from us",
    path: ["wantsAdvisor"],
  });

export type LeadInput = z.infer<typeof leadInputSchema>;

/** Events the browser may report. Server-truth events are deliberately not accepted here. */
export const CLIENT_EVENT_NAMES = [
  "path_started",
  "step_completed",
  "plan_viewed",
  "enrol_clicked",
  "lead_form_opened",
  "plan_shared",
  "plan_link_copied",
  "plan_printed",
] as const;

export const SERVER_EVENT_NAMES = ["plan_generated", "lead_submitted"] as const;

export type ClientEventName = (typeof CLIENT_EVENT_NAMES)[number];
export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];
export type EventName = ClientEventName | ServerEventName;

const propValue = z.union([z.string().max(60), z.number().finite(), z.boolean()]);

export const eventInputSchema = z.object({
  sessionId: sessionIdSchema,
  name: z.enum(CLIENT_EVENT_NAMES),
  props: z
    .record(z.string().max(30), propValue)
    .refine((p) => Object.keys(p).length <= 8, "Too many properties")
    .optional(),
});

export type EventInput = z.infer<typeof eventInputSchema>;
