import {
  DAILY_HOURS,
  EXPERIENCE_LEVELS,
  GOALS,
  INTEREST_IDS,
  MAX_INTERESTS,
  SKILL_IDS,
  STAGES,
  type Answers,
  type DailyHours,
  type Experience,
  type Goal,
  type InterestId,
  type SkillId,
  type Stage,
} from "@bitelevate/shared";

/*
 * Wizard draft state — deliberately free of any validation-library import, so pages that only
 * need to read or seed a draft (e.g. "Edit my answers" on the plan page) stay light. The server
 * still validates every request with the shared zod schemas.
 */

export interface Draft {
  stage?: Stage;
  experience?: Experience;
  goal?: Goal;
  interests: InterestId[];
  hoursPerDay?: DailyHours;
  examsSoon?: boolean;
  skills: SkillId[];
}

export const EMPTY_DRAFT: Draft = { interests: [], skills: [] };

export const STEPS = [
  { title: "Where are you right now?", short: "About you" },
  { title: "What do you want from the 60 days?", short: "Your goal" },
  { title: "What excites you?", short: "Interests" },
  { title: "How much time do you have?", short: "Time" },
  { title: "Which skills do you already have?", short: "Skills" },
] as const;

export const STEP_COUNT = STEPS.length;

/** Steps 3 (interests) and 5 (skills) are optional: "not sure" and "none yet" are valid answers. */
export function isStepComplete(step: number, draft: Draft): boolean {
  switch (step) {
    case 0:
      return Boolean(draft.stage && draft.experience);
    case 1:
      return Boolean(draft.goal);
    case 3:
      return Boolean(draft.hoursPerDay) && draft.examsSoon !== undefined;
    default:
      return true;
  }
}

/** Complete answers, or `null` while a required question is still unanswered. */
export function toAnswers(draft: Draft): Answers | null {
  const { stage, experience, goal, hoursPerDay, examsSoon } = draft;
  if (!stage || !experience || !goal || !hoursPerDay || examsSoon === undefined) return null;
  return {
    stage,
    experience,
    goal,
    interests: draft.interests,
    hoursPerDay,
    examsSoon,
    skills: draft.skills,
  };
}

const STORAGE_KEY = "bitelevate.draft";

const pick = <T extends string>(list: readonly T[], value: unknown): T | undefined =>
  list.find((item) => item === value);

const pickMany = <T extends string>(list: readonly T[], values: unknown): T[] =>
  Array.isArray(values) ? list.filter((item) => values.includes(item)) : [];

/** Restore saved progress, ignoring anything that is not a known value. */
export function loadSaved(): { draft: Draft; step: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: EMPTY_DRAFT, step: 0 };
    const saved = JSON.parse(raw) as { draft?: Record<string, unknown>; step?: unknown };
    const d = saved.draft ?? {};
    const draft: Draft = {
      stage: pick(STAGES, d.stage),
      experience: pick(EXPERIENCE_LEVELS, d.experience),
      goal: pick(GOALS, d.goal),
      interests: pickMany(INTEREST_IDS, d.interests).slice(0, MAX_INTERESTS),
      hoursPerDay: pick(DAILY_HOURS, d.hoursPerDay),
      examsSoon: typeof d.examsSoon === "boolean" ? d.examsSoon : undefined,
      skills: pickMany(SKILL_IDS, d.skills),
    };
    const step =
      typeof saved.step === "number" ? Math.min(Math.max(0, Math.floor(saved.step)), STEP_COUNT - 1) : 0;
    return { draft, step };
  } catch {
    return { draft: EMPTY_DRAFT, step: 0 };
  }
}

/** Pre-fill the wizard with existing answers (used by "Edit my answers" on the plan page). */
export function seedSaved(answers: Answers, step = 0) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: answers, step }));
  } catch {
    /* storage may be unavailable; the wizard will simply start empty */
  }
}

export function clearSaved() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage may be unavailable */
  }
}
