import {
  DAILY_HOURS,
  EXPERIENCE_LEVELS,
  GOALS,
  INTEREST_IDS,
  SKILL_IDS,
  STAGES,
  answersSchema,
  type Answers,
  type DailyHours,
  type Experience,
  type Goal,
  type InterestId,
  type SkillId,
  type Stage,
} from "@bitelevate/shared";
import { useCallback, useEffect, useState } from "react";

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

export function toAnswers(draft: Draft): Answers | null {
  const parsed = answersSchema.safeParse(draft);
  return parsed.success ? parsed.data : null;
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
      interests: pickMany(INTEREST_IDS, d.interests).slice(0, 3),
      hoursPerDay: pick(DAILY_HOURS, d.hoursPerDay),
      examsSoon: typeof d.examsSoon === "boolean" ? d.examsSoon : undefined,
      skills: pickMany(SKILL_IDS, d.skills),
    };
    const step = typeof saved.step === "number" ? Math.min(Math.max(0, Math.floor(saved.step)), STEP_COUNT - 1) : 0;
    return { draft, step };
  } catch {
    return { draft: EMPTY_DRAFT, step: 0 };
  }
}

export function clearSaved() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage may be unavailable */
  }
}

/** Wizard state with progress saved per tab, so a refresh or accidental back doesn't lose answers. */
export function useWizard() {
  const [{ draft, step }, setState] = useState(loadSaved);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, step }));
    } catch {
      /* storage may be unavailable */
    }
  }, [draft, step]);

  const update = useCallback(
    (patch: Partial<Draft>) => setState((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
    [],
  );
  const goTo = useCallback(
    (next: number) => setState((s) => ({ ...s, step: Math.min(Math.max(0, next), STEP_COUNT - 1) })),
    [],
  );

  return { draft, step, update, goTo, canContinue: isStepComplete(step, draft) };
}
