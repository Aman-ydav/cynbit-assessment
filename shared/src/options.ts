/**
 * Answer options for the guided flow. Defined once so the same list drives both the
 * validation schema (server) and the wizard UI (client).
 */
export const STAGES = ["year1", "year2", "year3", "final_year", "graduate", "switcher"] as const;
export const EXPERIENCE_LEVELS = ["none", "basics", "projects"] as const;
export const GOALS = ["credit", "first_job", "portfolio", "upskill"] as const;
export const DAILY_HOURS = ["lt1", "h1_5_2", "gt2"] as const;

export type Stage = (typeof STAGES)[number];
export type Experience = (typeof EXPERIENCE_LEVELS)[number];
export type Goal = (typeof GOALS)[number];
export type DailyHours = (typeof DAILY_HOURS)[number];

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

export const STAGE_OPTIONS: readonly Option<Stage>[] = [
  { value: "year1", label: "1st year" },
  { value: "year2", label: "2nd year" },
  { value: "year3", label: "3rd year" },
  { value: "final_year", label: "Final year" },
  { value: "graduate", label: "Graduate" },
  { value: "switcher", label: "Career switcher" },
];

export const EXPERIENCE_OPTIONS: readonly Option<Experience>[] = [
  { value: "none", label: "Brand new", hint: "I haven't written real code yet" },
  { value: "basics", label: "I know the basics", hint: "Small programs, tutorials, assignments" },
  { value: "projects", label: "I've built projects", hint: "Apps or repos I can show" },
];

export const GOAL_OPTIONS: readonly Option<Goal>[] = [
  {
    value: "credit",
    label: "College credit & training letter",
    hint: "Complete mandatory practical training with proof",
  },
  { value: "first_job", label: "Land my first tech job", hint: "Interview-ready skills and a repo" },
  { value: "portfolio", label: "Build a portfolio", hint: "Something real I can show recruiters" },
  { value: "upskill", label: "Level up what I know", hint: "Go deeper in a skill I already have" },
];

export const HOURS_OPTIONS: readonly Option<DailyHours>[] = [
  { value: "lt1", label: "Under 1 hour" },
  { value: "h1_5_2", label: "1.5 – 2 hours", hint: "What BitElevate expects" },
  { value: "gt2", label: "More than 2 hours" },
];

/** Numeric hours per day used for estimates. */
export const HOURS_VALUE: Record<DailyHours, number> = {
  lt1: 0.75,
  h1_5_2: 1.75,
  gt2: 2.5,
};

export const EXPERIENCE_LABEL: Record<Experience, string> = {
  none: "no coding experience yet",
  basics: "coding basics",
  projects: "hands-on project experience",
};

export const GOAL_LABEL: Record<Goal, string> = {
  credit: "college credit",
  first_job: "your first tech job",
  portfolio: "a standout portfolio",
  upskill: "levelling up",
};
